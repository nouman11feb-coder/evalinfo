import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Image, X } from 'lucide-react';
import { uploadImage, type UploadedImage } from '@/services/imageUpload';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (message: string, image?: UploadedImage) => void;
  isLoading: boolean;
}

const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
    if ((!inputValue.trim() && !selectedImage) || isLoading || isUploading) return;
    onSendMessage(inputValue, selectedImage || undefined);
    setInputValue('');
    setSelectedImage(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedImage = await uploadImage(file);
      setSelectedImage(uploadedImage);
      toast({
        title: "Image uploaded",
        description: `${file.name} uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
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
        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-3 p-3 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.filename}
                  className="w-16 h-16 object-cover rounded-lg border border-border"
                />
                <Button
                  onClick={handleRemoveImage}
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {selectedImage.filename}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="relative rounded-2xl border border-border input-enhanced bg-input/50 backdrop-blur-sm">
          <div className="absolute left-4 bottom-4 flex items-center gap-2">
            <Button
              onClick={handleImageButtonClick}
              disabled={isLoading || isUploading}
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground mobile-touch-target"
              aria-label="Upload image"
            >
              <Image className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedImage ? "Add a message with your image..." : "Ask anything..."}
            disabled={isLoading || isUploading}
            rows={1}
            className="max-h-40 resize-none border-0 bg-transparent pl-12 pr-14 py-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 mobile-text"
          />
          <Button
            onClick={handleSend}
            disabled={(!inputValue.trim() && !selectedImage) || isLoading || isUploading}
            size="icon"
            className="absolute right-3 bottom-3 h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover-scale disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-target"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          aria-label="Select image file"
        />

        <p className="mt-3 text-xs text-muted-foreground text-center hidden md:block">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground font-mono text-xs">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground font-mono text-xs">Shift + Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInput;