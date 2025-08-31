import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const LoadingMessage = () => {
  return (
    <article className="w-full rounded-2xl border border-border chat-bubble-assistant text-chat-assistant-foreground p-5">
      <div className="flex items-center gap-4">
        <Avatar className="h-9 w-9 flex-shrink-0 shadow-sm">
          <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-semibold">
            AI
          </AvatarFallback>
        </Avatar>
        <div className="flex space-x-1.5">
          <div className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce"></div>
          <div 
            className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce" 
            style={{ animationDelay: '0.1s' }}
          ></div>
          <div 
            className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce" 
            style={{ animationDelay: '0.2s' }}
          ></div>
        </div>
      </div>
    </article>
  );
};

export default LoadingMessage;