-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true);

-- Create policies for chat images
CREATE POLICY "Anyone can view chat images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-images');

CREATE POLICY "Anyone can upload chat images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Anyone can update their chat images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'chat-images');

CREATE POLICY "Anyone can delete chat images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-images');