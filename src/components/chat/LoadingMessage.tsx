import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const LoadingMessage = () => {
  return (
    <article className="w-full rounded-xl border border-border bg-chat-assistant text-chat-assistant-foreground p-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
            AI
          </AvatarFallback>
        </Avatar>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
          <div 
            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" 
            style={{ animationDelay: '0.1s' }}
          ></div>
          <div 
            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" 
            style={{ animationDelay: '0.2s' }}
          ></div>
        </div>
      </div>
    </article>
  );
};

export default LoadingMessage;