import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { getDocumentIcon } from '@/services/documentUpload';

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
                📷 {message.image.filename} • {(message.image.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
          {message.document && (
            <div className="mb-3 p-4 rounded-xl border border-border bg-card/30 hover-scale">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center text-xl flex-shrink-0">
                  {getDocumentIcon(message.document.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {message.document.filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(message.document.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(message.document?.url, '_blank')}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg hover:bg-muted/50"
                    aria-label="View document"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = message.document?.url || '';
                      link.download = message.document?.filename || 'document';
                      link.click();
                    }}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg hover:bg-muted/50"
                    aria-label="Download document"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          {message.voice && (
            <div className="mb-3 p-4 rounded-xl border border-border bg-card/30 hover-scale">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                  🎤
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Voice message ({Math.floor(message.voice.duration / 60)}:{(message.voice.duration % 60).toString().padStart(2, '0')})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(message.voice.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex gap-2">
                  <audio controls className="h-8">
                    <source src={message.voice.url} type="audio/webm" />
                    Your browser does not support the audio element.
                  </audio>
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = message.voice?.url || '';
                      link.download = message.voice?.filename || 'voice-message.webm';
                      link.click();
                    }}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg hover:bg-muted/50"
                    aria-label="Download voice message"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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