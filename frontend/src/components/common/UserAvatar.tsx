import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from '@/types';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: User | null;
  className?: string;
  fallbackClassName?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  className = "",
  fallbackClassName = ""
}) => {
  const [signedUrl, setSignedUrl] = React.useState<string>('');

  React.useEffect(() => {
    let isMounted = true;
    if (!user || !user.avatarUrl) {
      setSignedUrl('');
      return;
    }
    
    // Normalize user.avatarUrl
    let cleanAvatarUrl = user.avatarUrl;
    if (cleanAvatarUrl.startsWith('/api/')) {
        cleanAvatarUrl = cleanAvatarUrl.substring(4); // Remove "/api"
    }
    
    // If it's already a full URL, use it
    if (user.avatarUrl.startsWith('http')) {
      setSignedUrl(user.avatarUrl);
      return;
    }

    const fetchUrl = async () => {
      try {
        const endpoint = `${import.meta.env.VITE_API_URL || ''}/api${cleanAvatarUrl}`;
        const response = await import('@/api/client').then(m => m.default.get<{signedUrl: string}>(endpoint));
        if (isMounted && response.data?.signedUrl) {
          setSignedUrl(response.data.signedUrl);
        }
      } catch (err) {
        console.error("Failed to load avatar", err);
      }
    };
    fetchUrl();
    
    return () => { isMounted = false; };
  }, [user?.avatarUrl]);

  if (!user) return null;

  return (
    <Avatar className={cn("bg-white/5", className)}>
      {signedUrl && (
        <AvatarImage 
          src={signedUrl} 
          className="object-cover" 
          alt={`${user.firstName} ${user.lastName}`} 
        />
      )}
      <AvatarFallback className={cn("bg-indigo-600/20 text-indigo-400 font-black uppercase", fallbackClassName)}>
        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
