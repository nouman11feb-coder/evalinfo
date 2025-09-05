import { supabase } from '@/integrations/supabase/client';

export interface UploadedVoice {
  url: string;
  filename: string;
  size: number;
  duration: number;
}

export const uploadVoice = async (audioBlob: Blob, duration: number): Promise<UploadedVoice> => {
  // Validate file size (max 50MB)
  if (audioBlob.size > 50 * 1024 * 1024) {
    throw new Error('Voice message size must be less than 50MB');
  }

  // Generate unique filename
  const fileName = `voice-${Date.now()}-${Math.random().toString(36).substring(2)}.webm`;
  const filePath = `uploads/${fileName}`;

  // Convert blob to file for upload
  const file = new File([audioBlob], fileName, { type: 'audio/webm' });

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('chat-documents') // Using same bucket as documents
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('chat-documents')
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    filename: fileName,
    size: audioBlob.size,
    duration
  };
};

export const deleteVoice = async (filePath: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('chat-documents')
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};