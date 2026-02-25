import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Trash2, ChevronLeft, Edit2, Check, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useRef, useEffect } from 'react';
import SearchMessages from '@/components/SearchMessages';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  messages?: any[];
}

interface ChatHistoryProps {
  chats: Chat[];
  activeChat: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newName: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onToggleMobileMenu?: () => void;
  onSearchResultSelect?: (chatId: string, messageId: string) => void;
}

const ChatHistory = ({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  isCollapsed,
  onToggleCollapse,
  onToggleMobileMenu,
  onSearchResultSelect
}: ChatHistoryProps) => {
  const isMobile = useIsMobile();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = (chatId: string, currentName: string) => {
    setEditingChatId(chatId);
    setTempName(currentName);
  };

  const saveEdit = () => {
    if (editingChatId && tempName.trim()) {
      onRenameChat(editingChatId, tempName.trim());
    }
    setEditingChatId(null);
    setTempName('');
  };

  const cancelEdit = () => {
    setEditingChatId(null);
    setTempName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  useEffect(() => {
    if (editingChatId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingChatId]);
  return (
    <div className={`border-r border-sidebar-border sidebar-enhanced flex flex-col h-full transition-all duration-300 ${
    isCollapsed ? 'w-16' : 'w-80'}`
    }>
      {/* Header */}
      <div className="mobile-padding border-b border-sidebar-border/50 relative">
        <Button
          onClick={onToggleCollapse}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 hover:bg-sidebar-accent z-10 mobile-touch-target hidden md:flex items-center justify-center">

          <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${
          isCollapsed ? 'rotate-180' : ''}`
          } />
        </Button>
        
        {/* Mobile close button */}
        {onToggleMobileMenu &&
        <Button
          onClick={onToggleMobileMenu}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 hover:bg-sidebar-accent z-10 mobile-touch-target md:hidden"
          aria-label="Close menu">

            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        }
        
        {(!isCollapsed || isMobile) &&
        <>
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="h-10 w-10 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-lg">
                <MessageSquare className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-sidebar-foreground">Eval info</h1>
            </div>
            <Button
            onClick={onNewChat}
            className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground shadow-lg hover-scale rounded-xl mobile-touch-target"
            size="sm">

              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
            
            {/* Search Messages */}
            {chats.length > 0 && onSearchResultSelect &&
          <div className="mt-4">
                <SearchMessages
              chats={chats.filter((chat) => chat.messages && chat.messages.length > 0) as any}
              onSelectResult={onSearchResultSelect} />

              </div>
          }
          </>
        }
        
        {isCollapsed && !isMobile &&
        <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-lg">
              <MessageSquare className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <Button
            onClick={onNewChat}
            size="icon"
            className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground shadow-lg hover-scale rounded-xl mobile-touch-target">

              <Plus className="h-4 w-4" />
            </Button>
          </div>
        }
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {chats.map((chat) =>
          <div
            key={chat.id}
            className={`group relative rounded-xl cursor-pointer transition-all duration-200 hover-scale mobile-touch-target ${
            isCollapsed && !isMobile ? 'p-2' : 'p-3 md:p-4'} ${

            activeChat === chat.id ?
            'bg-sidebar-accent text-sidebar-accent-foreground shadow-md border border-sidebar-border/50' :
            'hover:bg-sidebar-accent/50 text-sidebar-foreground hover:shadow-sm'}`
            }
            onClick={() => onSelectChat(chat.id)}
            title={isCollapsed ? chat.name : undefined}>

              {!isCollapsed || isMobile ?
            <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    {editingChatId === chat.id ?
                <Input
                  ref={inputRef}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={cancelEdit}
                  className="mobile-text font-semibold bg-transparent border-0 px-0 py-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                  onClick={(e) => e.stopPropagation()} /> :


                <p className="mobile-text font-semibold truncate">{chat.name}</p>
                }
                    <p className="text-xs text-muted-foreground truncate mt-1 leading-relaxed">
                      {chat.lastMessage}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {editingChatId === chat.id ?
                <>
                        <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-green-500/10 hover:text-green-500 transition-all duration-200 mobile-touch-target"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveEdit();
                    }}>

                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 mobile-touch-target"
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelEdit();
                    }}>

                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </> :

                <>
                        <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500 transition-all duration-200 mobile-touch-target"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(chat.id, chat.name);
                    }}>

                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 mobile-touch-target"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}>

                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                }
                  </div>
                </div> :

            <div className="flex items-center justify-center">
                  <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-sidebar-primary" />
                  </div>
                </div>
            }
            </div>
          )}
        </div>
      </ScrollArea>
    </div>);

};

export default ChatHistory;