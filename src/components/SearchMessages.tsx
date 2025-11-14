import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface Chat {
  id: string;
  name: string;
  messages: Message[];
}

interface SearchResult {
  chatId: string;
  chatName: string;
  message: Message;
  messageIndex: number;
}

interface SearchMessagesProps {
  chats: Chat[];
  onSelectResult: (chatId: string, messageId: string) => void;
}

const SearchMessages = ({ chats, onSelectResult }: SearchMessagesProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    chats.forEach(chat => {
      chat.messages.forEach((message, index) => {
        if (message.text.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            chatId: chat.id,
            chatName: chat.name,
            message,
            messageIndex: index,
          });
        }
      });
    });

    setResults(searchResults);
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectResult(result.chatId, result.message.id);
    setIsOpen(false);
    setSearchQuery('');
    setResults([]);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-300 dark:bg-yellow-700 text-foreground">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Messages</DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search across all chats..."
              className="pl-9 pr-9"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setResults([]);
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="h-[400px] mt-4">
            {searchQuery && results.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages found for "{searchQuery}"
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.chatId}-${result.message.id}-${index}`}
                    onClick={() => handleSelectResult(result)}
                    className="w-full text-left p-4 rounded-lg hover:bg-accent transition-colors border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary">
                        {result.chatName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {result.message.sender === 'user' ? 'You' : 'Assistant'}
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                      {highlightText(result.message.text, searchQuery)}
                    </p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {result.message.timestamp.toLocaleDateString()} at{' '}
                      {result.message.timestamp.toLocaleTimeString()}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Start typing to search messages...
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SearchMessages;
