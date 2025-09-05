import { supabase } from '@/integrations/supabase/client';

export interface UploadedDocument {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// Allowed document types
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml'
];

export const uploadDocument = async (file: File): Promise<UploadedDocument> => {
  // Validate file type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    throw new Error('Please select a valid document file (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JSON, XML)');
  }

  // Validate file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('Document size must be less than 50MB');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('chat-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL (signed URL for private bucket)
  const { data: { signedUrl }, error: urlError } = await supabase.storage
    .from('chat-documents')
    .createSignedUrl(data.path, 3600); // 1 hour expiry

  if (urlError || !signedUrl) {
    throw new Error(`Failed to generate download URL: ${urlError?.message}`);
  }

  return {
    url: signedUrl,
    filename: file.name,
    size: file.size,
    mimeType: file.type
  };
};

export const deleteDocument = async (filePath: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('chat-documents')
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};

export const getDocumentIcon = (mimeType: string): string => {
  switch (mimeType) {
    case 'application/pdf':
      return '📄';
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '📝';
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return '📊';
    case 'application/vnd.ms-powerpoint':
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return '📊';
    case 'text/plain':
      return '📄';
    case 'text/csv':
      return '📋';
    case 'application/json':
    case 'application/xml':
    case 'text/xml':
      return '🗂️';
    default:
      return '📎';
  }
};