import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Image, X, FileText, Mic, Square } from 'lucide-react';
import { uploadImage, type UploadedImage } from '@/services/imageUpload';
import { uploadDocument, type UploadedDocument, getDocumentIcon } from '@/services/documentUpload';
import { uploadVoice, type UploadedVoice } from '@/services/voiceUpload';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (message: string, image?: UploadedImage, document?: UploadedDocument, voice?: UploadedVoice) => void;
  isLoading: boolean;
}

const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<UploadedVoice | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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
    if ((!inputValue.trim() && !selectedImage && !selectedDocument && !selectedVoice) || isLoading || isUploading) return;
    onSendMessage(inputValue, selectedImage || undefined, selectedDocument || undefined, selectedVoice || undefined);
    setInputValue('');
    setSelectedImage(null);
    setSelectedDocument(null);
    setSelectedVoice(null);
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

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedDocument = await uploadDocument(file);
      setSelectedDocument(uploadedDocument);
      toast({
        title: "Document uploaded",
        description: `${file.name} uploaded successfully`,
      });
    } catch (error) {
      console.error('Document upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
    }
  };

  const handleRemoveDocument = () => {
    setSelectedDocument(null);
  };

  const handleDocumentButtonClick = () => {
    documentInputRef.current?.click();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const duration = recordingTime;
        
        setIsUploading(true);
        try {
          const uploadedVoice = await uploadVoice(audioBlob, duration);
          setSelectedVoice(uploadedVoice);
          toast({
            title: "Voice message recorded",
            description: `${duration}s voice message ready to send`,
          });
        } catch (error) {
          console.error('Voice upload error:', error);
          toast({
            title: "Upload failed",
            description: error instanceof Error ? error.message : "Failed to upload voice message",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording started",
        description: "Speak your message...",
      });
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Recording failed",
        description: "Unable to access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const handleRemoveVoice = () => {
    setSelectedVoice(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-shrink-0 bg-transparent">
      <div className="max-w-3xl mx-auto mobile-padding space-y-4">
        {/* File Previews */}
        {(selectedImage || selectedDocument || selectedVoice) && (
          <div className="mb-3 space-y-3">
            {selectedImage && (
              <div className="p-3 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
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
                      📷 {selectedImage.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {selectedDocument && (
              <div className="p-3 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-lg border border-border bg-muted/50 flex items-center justify-center text-2xl">
                      {getDocumentIcon(selectedDocument.mimeType)}
                    </div>
                    <Button
                      onClick={handleRemoveDocument}
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {selectedDocument.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedDocument.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {selectedVoice && (
              <div className="p-3 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-lg border border-border bg-primary/10 flex items-center justify-center text-2xl">
                      🎤
                    </div>
                    <Button
                      onClick={handleRemoveVoice}
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      🎤 Voice message ({formatTime(selectedVoice.duration)})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedVoice.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Suggested prompts */}
        {!inputValue && !selectedImage && !selectedDocument && !selectedVoice && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {[
              "PDF viewer",
              "Fitness tracker", 
              "SaaS landing page",
              "E-commerce product page"
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInputValue(`Create a ${suggestion.toLowerCase()}`)}
                className="suggestion-chip px-4 py-2 rounded-full text-white/90 text-sm font-medium hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="relative rounded-3xl input-enhanced overflow-hidden max-w-2xl mx-auto">
          <div className="absolute left-4 bottom-4 flex items-center gap-2">
            <button
              className="suggestion-chip px-3 py-1.5 rounded-full text-white/80 text-sm font-medium hover:text-white flex items-center gap-2"
              onClick={handleImageButtonClick}
            >
              <Image className="h-4 w-4" />
              Attach
            </button>
            <button
              className="suggestion-chip px-3 py-1.5 rounded-full text-white/80 text-sm font-medium hover:text-white flex items-center gap-2"
              onClick={handleDocumentButtonClick}
            >
              <FileText className="h-4 w-4" />
              Document
            </button>
            <button
              className={`suggestion-chip px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
                isRecording 
                  ? 'text-red-400 hover:text-red-300' 
                  : 'text-white/80 hover:text-white'
              }`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isRecording ? 'Stop' : 'Voice'}
            </button>
          </div>
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording 
                ? `Recording... ${formatTime(recordingTime)}` 
                : (selectedImage || selectedDocument || selectedVoice) 
                  ? "Add a message with your file..." 
                  : "Ask Intelliscan to create a web app that..."
            }
            disabled={isLoading || isUploading || isRecording}
            rows={1}
            className="max-h-40 resize-none border-0 bg-transparent pl-32 pr-16 py-5 text-white placeholder:text-white/60 focus-visible:ring-0 focus-visible:ring-offset-0 mobile-text text-base"
          />
          <div 
            className={`absolute right-4 bottom-4 h-10 w-10 rounded-full bg-white hover:bg-white/90 cursor-pointer flex items-center justify-center mobile-touch-target transition-all ${
              ((!inputValue.trim() && !selectedImage && !selectedDocument && !selectedVoice) || isLoading || isUploading || isRecording)
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:shadow-lg hover:scale-105'
            }`}
            onClick={handleSend}
            role="button"
            tabIndex={0}
            aria-label="Send message"
          >
            <Send className="h-5 w-5 text-gray-800" />
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          aria-label="Select image file"
        />
        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml"
          onChange={handleDocumentUpload}
          className="hidden"
          aria-label="Select document file"
        />

        <p className="mt-4 text-xs text-white/60 text-center hidden md:block">
          Press <kbd className="px-1.5 py-0.5 bg-black/20 rounded text-white/70 font-mono text-xs">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 bg-black/20 rounded text-white/70 font-mono text-xs">Shift + Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInput;