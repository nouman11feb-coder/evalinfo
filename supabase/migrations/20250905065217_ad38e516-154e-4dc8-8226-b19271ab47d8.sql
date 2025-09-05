-- Create storage bucket for chat documents
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-documents', 'chat-documents', false);

-- Create policies for chat documents
CREATE POLICY "Anyone can view chat documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-documents');

CREATE POLICY "Anyone can upload chat documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-documents');

CREATE POLICY "Anyone can update their chat documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'chat-documents');

CREATE POLICY "Anyone can delete chat documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-documents');