import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Json } from '@/integrations/supabase/types';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  image?: { url: string; filename: string; size: number };
  document?: { url: string; filename: string; size: number; mimeType: string };
  voice?: { url: string; filename: string; size: number; duration: number };
}

export interface Chat {
  id: string;
  name: string;
  messages: Message[];
  lastMessage: string;
  timestamp: Date;
}

function parseJsonField<T>(data: Json | null): T | undefined {
  if (!data || typeof data !== 'object') return undefined;
  return data as unknown as T;
}

export function useChatDB() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  // Load conversations and messages from DB
  const loadChats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: convos, error: convoErr } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (convoErr) throw convoErr;

      if (!convos || convos.length === 0) {
        // Create initial chat
        const { data: newConvo, error: newErr } = await supabase
          .from('conversations')
          .insert({ user_id: user.id, name: 'Chat 1' })
          .select()
          .single();

        if (newErr) throw newErr;

        setChats([{
          id: newConvo.id,
          name: newConvo.name,
          messages: [],
          lastMessage: '',
          timestamp: new Date(newConvo.created_at),
        }]);
        setLoading(false);
        return;
      }

      // Load messages for all conversations
      const convoIds = convos.map(c => c.id);
      const { data: msgs, error: msgErr } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', convoIds)
        .order('created_at', { ascending: true });

      if (msgErr) throw msgErr;

      const messagesByConvo: Record<string, Message[]> = {};
      (msgs || []).forEach(m => {
        if (!messagesByConvo[m.conversation_id]) messagesByConvo[m.conversation_id] = [];
        messagesByConvo[m.conversation_id].push({
          id: m.id,
          text: m.text,
          sender: m.sender as 'user' | 'assistant',
          timestamp: new Date(m.created_at),
          image: parseJsonField(m.image_data),
          document: parseJsonField(m.document_data),
          voice: parseJsonField(m.voice_data),
        });
      });

      setChats(convos.map(c => ({
        id: c.id,
        name: c.name,
        messages: messagesByConvo[c.id] || [],
        lastMessage: (messagesByConvo[c.id] || []).slice(-1)[0]?.text?.substring(0, 50) || '',
        timestamp: new Date(c.updated_at),
      })));
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadChats(); }, [loadChats]);

  const addMessage = useCallback(async (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        text: message.text,
        sender: message.sender,
        image_data: message.image ? (message.image as unknown as Json) : null,
        document_data: message.document ? (message.document as unknown as Json) : null,
        voice_data: message.voice ? (message.voice as unknown as Json) : null,
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    const newMsg: Message = {
      id: data.id,
      text: data.text,
      sender: data.sender as 'user' | 'assistant',
      timestamp: new Date(data.created_at),
      image: parseJsonField(data.image_data),
      document: parseJsonField(data.document_data),
      voice: parseJsonField(data.voice_data),
    };

    setChats(prev => prev.map(chat =>
      chat.id === conversationId
        ? {
            ...chat,
            messages: [...chat.messages, newMsg],
            lastMessage: newMsg.text.substring(0, 50),
            timestamp: new Date(),
          }
        : chat
    ));

    return newMsg;
  }, []);

  const createChat = useCallback(async (name: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, name })
      .select()
      .single();

    if (error) throw error;

    const newChat: Chat = {
      id: data.id,
      name: data.name,
      messages: [],
      lastMessage: '',
      timestamp: new Date(data.created_at),
    };

    setChats(prev => [newChat, ...prev]);
    return newChat;
  }, [user]);

  const deleteChat = useCallback(async (chatId: string) => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', chatId);

    if (error) throw error;
    setChats(prev => prev.filter(c => c.id !== chatId));
  }, []);

  const renameChat = useCallback(async (chatId: string, newName: string) => {
    const { error } = await supabase
      .from('conversations')
      .update({ name: newName })
      .eq('id', chatId);

    if (error) throw error;
    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, name: newName } : c
    ));
  }, []);

  return { chats, loading, addMessage, createChat, deleteChat, renameChat, setChats };
}
