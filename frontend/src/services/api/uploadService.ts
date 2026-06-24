import { API_BASE_URL } from '@/utils/constants';

export interface UploadProgress {
  fileName: string;
  percent: number;
}

export type ProgressCallback = (progress: UploadProgress) => void;

/**
 * Uploads multiple driver documents to the server.
 * Uses XMLHttpRequest to track progress per file.
 */
export const uploadDriverDocuments = async (
  files: Record<string, File>,
  onProgress?: ProgressCallback
): Promise<Record<string, string>> => {
  const fileEntries = Object.entries(files);
  const results: Record<string, string> = {};

  // We upload files in parallel to track individual progress
  const uploadPromises = fileEntries.map(([key, file]) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress({ fileName: key, percent });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            // Assuming response contains the URL in a 'url' field
            results[key] = response.url || response.data?.url || 'URL_NOT_FOUND';
            resolve();
          } catch (e) {
            reject(new Error(`Failed to parse response for ${key}`));
          }
        } else {
          reject(new Error(`Upload failed for ${key} with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error(`Network error during upload of ${key}`));
      });

      // Use the centralized API_BASE_URL which already includes "/api"
      const uploadUrl = `${API_BASE_URL}/drivers/documents/upload`;
      xhr.open('POST', uploadUrl);
      
      // Add authorization if token exists
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  });

  await Promise.all(uploadPromises);
  return results;
};

/**
 * Generic image upload
 */
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/drivers/documents/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) throw new Error('Upload failed');
  const data = await response.json();
  return data.url || data.data?.url;
};
