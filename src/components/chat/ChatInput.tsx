import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Plus } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    const newHeight = Math.min(el.scrollHeight, 160);
    el.style.height = newHeight + 'px';
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto mobile-padding">
        <div className="relative rounded-2xl border border-border input-enhanced bg-input/50 backdrop-blur-sm">
          <div className="absolute left-4 bottom-4 text-muted-foreground">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </div>
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={isLoading}
            rows={1}
            className="max-h-40 resize-none border-0 bg-transparent pl-12 pr-14 py-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 mobile-text"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="absolute right-3 bottom-3 h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover-scale disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-target"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground text-center hidden md:block">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground font-mono text-xs">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground font-mono text-xs">Shift + Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInput;