import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
}

interface ChatHistoryProps {
  chats: Chat[];
  activeChat: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
}

const ChatHistory = ({ 
  chats, 
  activeChat, 
  onSelectChat, 
  onNewChat, 
  onDeleteChat 
}: ChatHistoryProps) => {
  return (
    <div className="w-80 border-r border-sidebar-border sidebar-enhanced flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-lg">
            <MessageSquare className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-sidebar-foreground">intelliscan</h1>
        </div>
        <Button 
          onClick={onNewChat}
          className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground shadow-lg hover-scale rounded-xl"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 hover-scale ${
                activeChat === chat.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md border border-sidebar-border/50'
                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground hover:shadow-sm'
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{chat.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1 leading-relaxed">
                    {chat.lastMessage}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatHistory;