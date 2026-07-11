import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fileEndpoint: string; // e.g. "/api/uploads/avatars/xyz.jpg"
  fallbackSrc?: string;
}

export const SecureImage: React.FC<SecureImageProps> = ({ fileEndpoint, fallbackSrc, className, alt, ...props }) => {
  const [imgSrc, setImgSrc] = useState<string>(fallbackSrc || '');
  const [loading, setLoading] = useState(true);

  const [retryCount, setRetryCount] = useState(0);

  const fetchSignedUrl = async (isRetry = false) => {
    try {
      setLoading(true);
      // If fileEndpoint is already an absolute HTTP URL, just use it
      if (fileEndpoint.startsWith('http')) {
        setImgSrc(fileEndpoint);
        return;
      }
      
      // Otherwise, fetch the signed URL from the backend
      const response = await apiClient.get<{ signedUrl: string; expiresIn: number }>(fileEndpoint);
      if (response.data && response.data.signedUrl) {
        setImgSrc(response.data.signedUrl);
      }
    } catch (error) {
      console.error("Failed to load secure image", error);
      if (fallbackSrc) {
        setImgSrc(fallbackSrc);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!fileEndpoint) {
      setLoading(false);
      return;
    }
    fetchSignedUrl();
  }, [fileEndpoint, fallbackSrc]);

  const handleError = () => {
    if (retryCount < 1) {
      setRetryCount(prev => prev + 1);
      fetchSignedUrl(true);
    } else if (fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  if (loading && !imgSrc) {
    return <div className={`animate-pulse bg-muted ${className}`} />;
  }

  return (
    <img 
      src={imgSrc} 
      alt={alt || "Secure Image"} 
      className={className} 
      onError={handleError}
      {...props} 
    />
  );
};
