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
    <div className={`flex w-full gap-4 group ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.sender === 'assistant' && (
        <Avatar className="h-8 w-8 flex-shrink-0 shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
            AI
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[85%] md:max-w-[70%] ${message.sender === 'user' ? 'order-1' : 'order-2'}`}>
        <div
          className={`rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
            message.sender === 'assistant'
              ? 'bg-card border border-border text-card-foreground'
              : 'bg-primary text-primary-foreground ml-auto'
          }`}
        >
          <div className="space-y-3">
            {message.image && (
              <div className="space-y-2">
                <img 
                  src={message.image.url} 
                  alt={message.image.filename}
                  className="max-w-xs w-full h-auto rounded-lg border border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.open(message.image?.url, '_blank')}
                />
                <p className={`text-xs ${message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  📷 {message.image.filename} • {(message.image.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
            {message.document && (
              <div className={`p-3 rounded-lg border transition-colors ${
                message.sender === 'user' 
                  ? 'border-primary-foreground/20 bg-primary-foreground/10' 
                  : 'border-border bg-muted/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                    message.sender === 'user' ? 'bg-primary-foreground/20' : 'bg-muted/50'
                  }`}>
                    {getDocumentIcon(message.document.mimeType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      message.sender === 'user' ? 'text-primary-foreground' : 'text-foreground'
                    }`}>
                      {message.document.filename}
                    </p>
                    <p className={`text-xs ${
                      message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {(message.document.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => window.open(message.document?.url, '_blank')}
                      size="icon"
                      variant="ghost"
                      className={`h-7 w-7 rounded-md ${
                        message.sender === 'user' 
                          ? 'hover:bg-primary-foreground/20 text-primary-foreground/80' 
                          : 'hover:bg-muted/50'
                      }`}
                      aria-label="View document"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
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
                      className={`h-7 w-7 rounded-md ${
                        message.sender === 'user' 
                          ? 'hover:bg-primary-foreground/20 text-primary-foreground/80' 
                          : 'hover:bg-muted/50'
                      }`}
                      aria-label="Download document"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {message.voice && (
              <div className={`p-3 rounded-lg border transition-colors ${
                message.sender === 'user' 
                  ? 'border-primary-foreground/20 bg-primary-foreground/10' 
                  : 'border-border bg-muted/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                    message.sender === 'user' ? 'bg-primary-foreground/20' : 'bg-primary/10'
                  }`}>
                    🎤
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      message.sender === 'user' ? 'text-primary-foreground' : 'text-foreground'
                    }`}>
                      Voice message ({Math.floor(message.voice.duration / 60)}:{(message.voice.duration % 60).toString().padStart(2, '0')})
                    </p>
                    <p className={`text-xs ${
                      message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {(message.voice.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <audio controls className="h-8 max-w-32">
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
                      className={`h-7 w-7 rounded-md ${
                        message.sender === 'user' 
                          ? 'hover:bg-primary-foreground/20 text-primary-foreground/80' 
                          : 'hover:bg-muted/50'
                      }`}
                      aria-label="Download voice message"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {message.text && (
              <div className={`mobile-text leading-relaxed whitespace-pre-wrap ${
                message.sender === 'user' ? 'text-primary-foreground' : 'text-foreground'
              }`}>
                {renderBold(message.text)}
              </div>
            )}
          </div>
        </div>
        
        <div className={`flex items-center mt-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
          message.sender === 'user' ? 'justify-end text-muted-foreground' : 'justify-start text-muted-foreground'
        }`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {message.sender === 'user' && (
        <Avatar className="h-8 w-8 flex-shrink-0 shadow-sm order-2">
          <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white font-semibold text-sm">
            U
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;