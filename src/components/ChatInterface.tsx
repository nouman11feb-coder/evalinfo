import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const ChatInterface = () => {
  const { toast } = useToast();
  const webhookUrl = "http://n8n3.intelliscan.online:5680/webhook/7b312b28-98f3-4d95-b696-203f37c338e4";
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "How I can help you today? I'm a smart genius assistant",
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

useEffect(() => {
  scrollToBottom();
}, [messages]);

// Update document title for basic SEO
useEffect(() => {
  document.title = 'ChatGPT-style AI Assistant';
}, []);

// Auto-resize textarea like ChatGPT
const textareaRef = useRef<HTMLTextAreaElement>(null);
const adjustTextareaHeight = () => {
  const el = textareaRef.current;
  if (!el) return;
  el.style.height = '0px';
  const newHeight = Math.min(el.scrollHeight, 160);
  el.style.height = newHeight + 'px';
};
useEffect(() => {
  adjustTextareaHeight();
}, [inputValue]);

// Simple bold renderer: turns **text** into <strong>text</strong>
const renderBold = (text: string): React.ReactNode => {
  if (!text || !text.includes("**")) return text;
  const parts = text.split("**");
  return parts.map((part, idx) =>
    idx % 2 === 1 ? <strong key={idx}>{part}</strong> : <span key={idx}>{part}</span>
  );
};

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    const currentInput = inputValue;
    setInputValue('');
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
          message: currentInput,
          timestamp: new Date().toISOString(),
          sender: 'user',
          chat_id: 'chat_' + Date.now(),
          triggered_from: window.location.origin,
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
      setMessages(prev => [...prev, aiResponse]);
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
      setMessages(prev => [...prev, errorResponse]);
      
      toast({
        title: "Error",
        description: "Failed to send message to webhook. Please check the connection.",
        variant: "destructive",
      });
    }
  };

const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
};

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-foreground">AI Assistant</h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-3">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`w-full rounded-xl border border-border ${
                  message.sender === 'assistant' ? 'bg-muted' : 'bg-background'
                } p-4`}
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.sender === 'assistant' ? 'AI' : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {renderBold(message.text)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            {isLoading && (
              <article className="w-full rounded-xl border border-border bg-muted p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </article>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="relative rounded-full border border-border bg-input shadow-sm">
            <div className="absolute left-3 bottom-2.5 text-muted-foreground">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </div>
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything"
              disabled={isLoading}
              rows={1}
              className="max-h-40 resize-none border-0 bg-transparent pl-9 pr-12 py-3 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8 rounded-full"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </div>

    </div>
  );
};

export default ChatInterface;