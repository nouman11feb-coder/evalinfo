import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import ChatHistory from './chat/ChatHistory';
import ChatMessage from './chat/ChatMessage';
import ChatInput from './chat/ChatInput';
import LoadingMessage from './chat/LoadingMessage';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  image?: {
    url: string;
    filename: string;
    size: number;
  };
}

interface Chat {
  id: string;
  name: string;
  messages: Message[];
  lastMessage: string;
  timestamp: Date;
}

const ChatInterface = () => {
  const { toast } = useToast();
  const webhookUrl = "https://n8n13.intelliscan.online/webhook-test/b96886e7-b9e0-419c-a59f-59306a89db88";
  
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      name: 'Chat 1',
      messages: [
        {
          id: '1',
          text: "How I can help you today? I'm a smart genius assistant",
          sender: 'assistant',
          timestamp: new Date(),
        },
      ],
      lastMessage: "How I can help you today? I'm a smart genius assistant",
      timestamp: new Date(),
    },
  ]);
  const [activeChat, setActiveChat] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find(chat => chat.id === activeChat);
  const messages = currentChat?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

useEffect(() => {
  scrollToBottom();
}, [messages]);

// Update document title for basic SEO
useEffect(() => {
  document.title = "intelliscan";
}, []);

// Load chats from localStorage
useEffect(() => {
  const savedChats = localStorage.getItem('intelliscan-chats');
  if (savedChats) {
    try {
      const parsed = JSON.parse(savedChats);
      setChats(parsed.map((chat: any) => ({
        ...chat,
        timestamp: new Date(chat.timestamp),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      })));
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  }
}, []);

// Save chats to localStorage
useEffect(() => {
  localStorage.setItem('intelliscan-chats', JSON.stringify(chats));
}, [chats]);

  const handleSendMessage = async (inputValue: string, image?: { url: string; filename: string; size: number }) => {
    if ((!inputValue.trim() && !image) || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue || (image ? `Sent an image: ${image.filename}` : ''),
      sender: 'user',
      timestamp: new Date(),
      ...(image && { image }),
    };

    // Update messages in the current chat
    setChats(prev => prev.map(chat => 
      chat.id === activeChat 
        ? { 
            ...chat, 
            messages: [...chat.messages, newMessage],
            lastMessage: inputValue || (image ? `📷 ${image.filename}` : ''),
            timestamp: new Date()
          }
        : chat
    ));

    setIsLoading(true);

    try {
      console.log("Sending message to webhook:", webhookUrl);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          message: inputValue || (image ? `Image: ${image.filename}` : ''),
          timestamp: new Date().toISOString(),
          sender: 'user',
          chat_id: activeChat,
          triggered_from: window.location.origin,
          ...(image && { 
            image: {
              url: image.url,
              filename: image.filename,
              size: image.size
            }
          }),
        }),
      });

      const extractText = (payload: any): string => {
        if (payload == null) return '';
        if (typeof payload === 'string') return payload;
        if (typeof payload === 'number' || typeof payload === 'boolean') return String(payload);
        // Common fields
        const candidates = [
          payload.output,
          payload.text,
          payload.message,
          payload.reply,
          payload.result,
          payload.response,
          payload.content,
          payload.data?.output,
          payload.data?.text,
          payload.data?.message,
        ].filter((v) => typeof v === 'string') as string[];
        if (candidates.length > 0) return candidates[0];

        // Arrays: find first string or object with known field
        if (Array.isArray(payload)) {
          for (const item of payload) {
            const t = extractText(item);
            if (t) return t;
          }
        }

        // Single-key object with string value
        const keys = Object.keys(payload);
        if (keys.length === 1 && typeof (payload as any)[keys[0]] === 'string') {
          return (payload as any)[keys[0]];
        }

        return '';
      };

      let replyText = '';
      try {
        const contentType = response.headers.get('content-type') || '';
        console.log("Response status:", response.status);
        console.log("Response content-type:", contentType);
        
        if (contentType.includes('application/json')) {
          const data = await response.json();
          console.log("JSON response data:", data);
          replyText = extractText(data) || 'No content returned from webhook.';
        } else {
          const textData = await response.text();
          console.log("Text response data:", textData);
          replyText = textData || 'No content returned from webhook.';
        }
        console.log("Final replyText:", replyText);
      } catch (e) {
        console.error("Error parsing response:", e);
        replyText = 'Received response but could not parse content.';
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: replyText.trim(),
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      // Update messages in the current chat
      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { 
              ...chat, 
              messages: [...chat.messages, aiResponse],
              lastMessage: replyText.trim().substring(0, 50) + (replyText.length > 50 ? '...' : ''),
              timestamp: new Date()
            }
          : chat
      ));
      
      setIsLoading(false);

    } catch (error) {
      console.error("Error sending to webhook:", error);
      setIsLoading(false);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, there was an error sending your message to the webhook. Please try again.",
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      // Update messages in the current chat
      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { 
              ...chat, 
              messages: [...chat.messages, errorResponse],
              lastMessage: "Error occurred",
              timestamp: new Date()
            }
          : chat
      ));
      
      toast({
        title: "Error",
        description: "Failed to send message to webhook. Please check the connection.",
        variant: "destructive",
      });
    }
  };

const handleNewChat = () => {
  const chatNumber = chats.length + 1;
  const newChat: Chat = {
    id: Date.now().toString(),
    name: `Chat ${chatNumber}`,
    messages: [
      {
        id: Date.now().toString(),
        text: "How I can help you today? I'm a smart genius assistant",
        sender: 'assistant',
        timestamp: new Date(),
      },
    ],
    lastMessage: "How I can help you today? I'm a smart genius assistant",
    timestamp: new Date(),
  };
  
  setChats(prev => [...prev, newChat]);
  setActiveChat(newChat.id);
};

const handleSelectChat = (chatId: string) => {
  setActiveChat(chatId);
};

const handleDeleteChat = (chatId: string) => {
  if (chats.length === 1) return; // Don't delete the last chat
  
  setChats(prev => prev.filter(chat => chat.id !== chatId));
  
  if (activeChat === chatId) {
    const remainingChats = chats.filter(chat => chat.id !== chatId);
    setActiveChat(remainingChats[0]?.id || '');
  }
};

const handleToggleSidebar = () => {
  setSidebarCollapsed(!sidebarCollapsed);
};

const handleToggleMobileMenu = () => {
  setMobileMenuOpen(!mobileMenuOpen);
};

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={handleToggleMobileMenu}
        />
      )}
      
      {/* Chat History Sidebar */}
      <div className={`mobile-sidebar ${!mobileMenuOpen ? 'mobile-sidebar-hidden' : ''}`}>
        <ChatHistory
          chats={chats.map(chat => ({
            id: chat.id,
            name: chat.name,
            lastMessage: chat.lastMessage,
            timestamp: chat.timestamp
          }))}
          activeChat={activeChat}
          onSelectChat={(chatId) => {
            handleSelectChat(chatId);
            setMobileMenuOpen(false); // Close mobile menu on chat select
          }}
          onNewChat={() => {
            handleNewChat();
            setMobileMenuOpen(false); // Close mobile menu on new chat
          }}
          onDeleteChat={handleDeleteChat}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          onToggleMobileMenu={handleToggleMobileMenu}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with User Profile */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto mobile-padding">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleToggleMobileMenu}
                  className="mobile-touch-target flex items-center justify-center rounded-lg hover:bg-muted/50 md:hidden"
                  aria-label="Toggle menu"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h2 className="text-lg font-semibold text-foreground">
                  {currentChat?.name || 'Chat'}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block px-4 py-2 rounded-xl bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">
                    Authentication required - Connect to Supabase to enable login/logout
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto px-3 py-4 md:px-4 md:py-6">
            <div className="space-y-3 md:space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && <LoadingMessage />}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatInterface;