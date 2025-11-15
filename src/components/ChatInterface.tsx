import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ChatHistory from './chat/ChatHistory';
import ChatMessage from './chat/ChatMessage';
import ChatInput from './chat/ChatInput';
import LoadingMessage from './chat/LoadingMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import NavMenu from './NavMenu';

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
  document?: {
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  };
  voice?: {
    url: string;
    filename: string;
    size: number;
    duration: number;
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
  const { user, signOut } = useAuth();
  const webhookUrl = "https://n8n4.evalinfo.com/webhook/2bc8da38-7484-4aa2-a1fc-eb1659f696c0";
  
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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

  const handleSendMessage = async (inputValue: string, image?: { url: string; filename: string; size: number }, document?: { url: string; filename: string; size: number; mimeType: string }, voice?: { url: string; filename: string; size: number; duration: number }) => {
    if ((!inputValue.trim() && !image && !document && !voice) || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue || (image ? `Sent an image: ${image.filename}` : '') || (document ? `Sent a document: ${document.filename}` : '') || (voice ? `Sent a voice message` : ''),
      sender: 'user',
      timestamp: new Date(),
      ...(image && { image }),
      ...(document && { document }),
      ...(voice && { voice }),
    };

    // Update messages in the current chat
    setChats(prev => prev.map(chat => 
      chat.id === activeChat 
        ? { 
            ...chat, 
            messages: [...chat.messages, newMessage],
            lastMessage: inputValue || (image ? `📷 ${image.filename}` : '') || (document ? `📎 ${document.filename}` : '') || (voice ? `🎤 Voice message` : ''),
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
          message: inputValue || (image ? `Image: ${image.filename}` : '') || (document ? `Document: ${document.filename}` : '') || (voice ? `Voice message` : ''),
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
          ...(document && { 
            document: {
              url: document.url,
              filename: document.filename,
              size: document.size,
              mimeType: document.mimeType
            }
          }),
          ...(voice && { 
            voice: {
              url: voice.url,
              filename: voice.filename,
              size: voice.size,
              duration: voice.duration
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

const handleRenameChat = (chatId: string, newName: string) => {
  if (!newName.trim()) return;
  
  setChats(prev => prev.map(chat => 
    chat.id === chatId 
      ? { ...chat, name: newName.trim() }
      : chat
  ));
};

const startEditingTitle = () => {
  setTempTitle(currentChat?.name || '');
  setIsEditingTitle(true);
  // Focus input after state update
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
  if (e.key === 'Enter') {
    saveTitle();
  } else if (e.key === 'Escape') {
    cancelEdit();
  }
};

const handleSignOut = async () => {
  await signOut();
};

const handleSearchResultSelect = (chatId: string, messageId: string) => {
  setActiveChat(chatId);
  setMobileMenuOpen(false);
  
  // Scroll to the message after a brief delay to ensure chat is loaded
  setTimeout(() => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a highlight effect
      messageElement.classList.add('ring-2', 'ring-primary', 'rounded-lg');
      setTimeout(() => {
        messageElement.classList.remove('ring-2', 'ring-primary', 'rounded-lg');
      }, 2000);
    }
  }, 100);
};

// Focus input when editing starts
useEffect(() => {
  if (isEditingTitle && titleInputRef.current) {
    titleInputRef.current.focus();
    titleInputRef.current.select();
  }
}, [isEditingTitle]);

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
          onRenameChat={handleRenameChat}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          onToggleMobileMenu={handleToggleMobileMenu}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
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
        
        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
            {/* Empty state message */}
            {messages.length === 1 && messages[0].sender === 'assistant' && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <h1 className="text-4xl md:text-5xl font-normal text-foreground text-center mb-8">
                  Ready when you are.
                </h1>
              </div>
            )}
            
            {/* Chat messages */}
            {messages.length > 1 && (
              <div className="space-y-6">
                {messages.slice(1).map((message) => (
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

        {/* Input */}
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} messages={messages} />
      </div>
    </div>
  );
};

export default ChatInterface;