import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChatDB, Message } from '@/hooks/useChatDB';
import { supabase } from '@/integrations/supabase/client';
import ChatHistory from './chat/ChatHistory';
import ChatMessage from './chat/ChatMessage';
import ChatInput from './chat/ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import NavMenu from './NavMenu';
import { toast } from 'sonner';

const ChatInterface = () => {
  const { user, signOut } = useAuth();
  const { chats, loading: chatsLoading, addMessage, createChat, deleteChat, renameChat } = useChatDB();

  const [activeChat, setActiveChat] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Set active chat when chats load
  useEffect(() => {
    if (chats.length > 0 && !activeChat) {
      setActiveChat(chats[0].id);
    }
  }, [chats, activeChat]);

  const currentChat = chats.find(chat => chat.id === activeChat);
  const messages = currentChat?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    document.title = "Eval info Ai";
  }, []);

  const handleSendMessage = async (
    inputValue: string,
    image?: { url: string; filename: string; size: number },
    document?: { url: string; filename: string; size: number; mimeType: string },
    voice?: { url: string; filename: string; size: number; duration: number }
  ) => {
    if ((!inputValue.trim() && !image && !document && !voice) || isLoading || !activeChat) return;

    const messageText = inputValue || (image ? `Sent an image: ${image.filename}` : '') || (document ? `Sent a document: ${document.filename}` : '') || (voice ? `Sent a voice message` : '');

    try {
      // Save user message to DB
      await addMessage(activeChat, {
        text: messageText,
        sender: 'user',
        ...(image && { image }),
        ...(document && { document }),
        ...(voice && { voice }),
      });
    } catch (err) {
      console.error('Failed to save message:', err);
      toast.error('Failed to save message');
      return;
    }

    setIsLoading(true);

    try {
      const isImageGen = inputValue.trim().toLowerCase().startsWith('/imagine ');
      
      if (isImageGen) {
        const imagePrompt = inputValue.trim().substring(9);
        const { data, error } = await supabase.functions.invoke('chat', {
          body: { messages: [{ prompt: imagePrompt }], action: 'generate-image' },
        });

        if (error) throw error;

        const replyText = data?.reply || 'Here is your generated image:';
        const imageUrl = data?.image;

        if (imageUrl) {
          await addMessage(activeChat, {
            text: replyText,
            sender: 'assistant',
            image: { url: imageUrl, filename: 'generated-image.png', size: 0 },
          });
        } else {
          await addMessage(activeChat, {
            text: replyText || 'Image generation did not return an image.',
            sender: 'assistant',
          });
        }
      } else {
        // Build conversation history for AI
        const aiMessages = messages
          .filter(m => m.text)
          .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));
        aiMessages.push({ role: 'user', content: inputValue || messageText });

        const { data, error } = await supabase.functions.invoke('chat', {
          body: { messages: aiMessages, action: 'chat' },
        });

        if (error) throw error;

        const replyText = data?.reply || 'No response received.';
        await addMessage(activeChat, { text: replyText, sender: 'assistant' });
      }
    } catch (error: any) {
      console.error('AI error:', error);
      const errorText = error?.message || 'Something went wrong. Please try again.';
      toast.error('AI Error', { description: errorText });

      await addMessage(activeChat, {
        text: `Sorry, an error occurred: ${errorText}`,
        sender: 'assistant',
      });
    }

    setIsLoading(false);
  };

  const handleNewChat = async () => {
    const chatNumber = chats.length + 1;
    try {
      const newChat = await createChat(`Chat ${chatNumber}`);
      if (newChat) setActiveChat(newChat.id);
    } catch (err) {
      console.error('Failed to create chat:', err);
      toast.error('Failed to create new chat');
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChat(chatId);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (chats.length === 1) return;
    try {
      await deleteChat(chatId);
      if (activeChat === chatId) {
        const remaining = chats.filter(c => c.id !== chatId);
        setActiveChat(remaining[0]?.id || '');
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
      toast.error('Failed to delete chat');
    }
  };

  const handleRenameChat = async (chatId: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      await renameChat(chatId, newName.trim());
    } catch (err) {
      console.error('Failed to rename chat:', err);
    }
  };

  const handleToggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleToggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const startEditingTitle = () => {
    setTempTitle(currentChat?.name || '');
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const saveTitle = () => {
    if (tempTitle.trim() && currentChat) {
      handleRenameChat(currentChat.id, tempTitle.trim());
    }
    setIsEditingTitle(false);
    setTempTitle('');
  };

  const cancelEdit = () => {
    setIsEditingTitle(false);
    setTempTitle('');
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveTitle();
    else if (e.key === 'Escape') cancelEdit();
  };

  const handleSignOut = async () => { await signOut(); };

  const handleSearchResultSelect = (chatId: string, messageId: string) => {
    setActiveChat(chatId);
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(`message-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary', 'rounded-lg');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'rounded-lg'), 2000);
      }
    }, 100);
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  if (chatsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {mobileMenuOpen && (
        <div className="mobile-sidebar-overlay" onClick={handleToggleMobileMenu} />
      )}

      <div className={`mobile-sidebar ${!mobileMenuOpen ? 'mobile-sidebar-hidden' : ''}`}>
        <ChatHistory
          chats={chats.map(chat => ({
            id: chat.id,
            name: chat.name,
            lastMessage: chat.lastMessage,
            timestamp: chat.timestamp,
            messages: chat.messages,
          }))}
          activeChat={activeChat}
          onSelectChat={(chatId) => { handleSelectChat(chatId); setMobileMenuOpen(false); }}
          onNewChat={() => { handleNewChat(); setMobileMenuOpen(false); }}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          onToggleMobileMenu={handleToggleMobileMenu}
          onSearchResultSelect={handleSearchResultSelect}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto mobile-padding">
            <div className="flex items-center justify-between">
              <button
                onClick={handleToggleMobileMenu}
                className="mobile-touch-target flex items-center justify-center rounded-lg hover:bg-muted/50 md:hidden"
                aria-label="Toggle menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <NavMenu
                userEmail={user?.email}
                onSignOut={handleSignOut}
                chatTitle={currentChat?.name}
                isEditingTitle={isEditingTitle}
                tempTitle={tempTitle}
                onStartEditTitle={startEditingTitle}
                onSaveTitle={saveTitle}
                onCancelEdit={cancelEdit}
                onTitleChange={setTempTitle}
                onTitleKeyPress={handleTitleKeyPress}
                titleInputRef={titleInputRef}
              />
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <h1 className="text-4xl md:text-5xl font-normal text-foreground text-center mb-8">
                  Ready when you are.
                </h1>
              </div>
            )}

            {messages.length > 0 && (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id} id={`message-${message.id}`}>
                    <ChatMessage message={message} />
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-8 w-8 flex-shrink-0 shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                          AI
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} messages={messages} />
      </div>
    </div>
  );
};

export default ChatInterface;
