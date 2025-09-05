import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

interface ChatMessageProps {
  message: Message;
}

// Simple bold renderer: turns **text** into <strong>text</strong>
const renderBold = (text: string): React.ReactNode => {
  if (!text || !text.includes("**")) return text;
  const parts = text.split("**");
  return parts.map((part, idx) =>
    idx % 2 === 1 ? <strong key={idx}>{part}</strong> : <span key={idx}>{part}</span>
  );
};

const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <article
      className={`w-full rounded-2xl border p-4 md:p-5 hover-scale ${
        message.sender === 'assistant' 
          ? 'chat-bubble-assistant text-chat-assistant-foreground' 
          : 'chat-bubble-user text-chat-user-foreground border-none'
      }`}
    >
      <div className="flex items-start gap-3 md:gap-4">
        <Avatar className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0 shadow-sm">
          <AvatarFallback className={
            message.sender === 'assistant' 
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' 
              : 'bg-primary text-primary-foreground font-semibold'
          }>
            {message.sender === 'assistant' ? 'AI' : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          {message.image && (
            <div className="mb-3">
              <img 
                src={message.image.url} 
                alt={message.image.filename}
                className="max-w-sm w-full h-auto rounded-xl border border-border shadow-sm hover-scale cursor-pointer"
                onClick={() => window.open(message.image?.url, '_blank')}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {message.image.filename} • {(message.image.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
          {message.text && (
            <p className="mobile-text leading-relaxed whitespace-pre-wrap">
              {renderBold(message.text)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
};

export default ChatMessage;