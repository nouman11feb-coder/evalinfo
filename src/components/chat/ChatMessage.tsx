import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
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
      className={`w-full rounded-xl border border-border p-4 ${
        message.sender === 'assistant' 
          ? 'bg-chat-assistant text-chat-assistant-foreground' 
          : 'bg-chat-user text-chat-user-foreground'
      }`}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className={
            message.sender === 'assistant' 
              ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
              : 'bg-primary text-primary-foreground'
          }>
            {message.sender === 'assistant' ? 'AI' : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {renderBold(message.text)}
          </p>
        </div>
      </div>
    </article>
  );
};

export default ChatMessage;