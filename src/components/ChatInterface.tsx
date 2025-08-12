import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const ChatInterface = () => {
  const { toast } = useToast();
  const webhookUrl = "https://evalinfo3.app.n8n.cloud/webhook/lovable";
  
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
        if (contentType.includes('application/json')) {
          const data = await response.json();
          replyText = extractText(data) || 'No content returned from webhook.';
        } else {
          replyText = (await response.text()) || 'No content returned from webhook.';
        }
      } catch (e) {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-chat-user text-chat-user-foreground'
                      : 'bg-chat-assistant text-chat-assistant-foreground border border-border'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.text}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-3xl rounded-2xl px-4 py-3 bg-chat-assistant text-chat-assistant-foreground border border-border">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="pr-12 bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;