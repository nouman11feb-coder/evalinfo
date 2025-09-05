import { supabase } from '@/integrations/supabase/client';

export interface UploadedImage {
  url: string;
  filename: string;
  size: number;
}

export const uploadImage = async (file: File): Promise<UploadedImage> => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file');
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size must be less than 10MB');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('chat-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('chat-images')
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    filename: file.name,
    size: file.size
  };
};

export const deleteImage = async (filePath: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('chat-images')
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};