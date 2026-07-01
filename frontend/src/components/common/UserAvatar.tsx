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
  // Use useMemo to stabilize the URL and prevent re-renders from triggering new requests
  const avatarUrl = React.useMemo(() => {
    if (!user || !user.avatarUrl) return null;
    
    // Normalize user.avatarUrl to remove duplicate /api if it exists
    let cleanAvatarUrl = user.avatarUrl;
    if (cleanAvatarUrl.startsWith('/api/')) {
        cleanAvatarUrl = cleanAvatarUrl.substring(4); // Remove "/api"
    }
    
    // If it's already a full URL (like Supabase), use it, otherwise prepend API URL
    const baseUrl = user.avatarUrl.startsWith('http') 
      ? user.avatarUrl 
      : `${import.meta.env.VITE_API_URL || ''}${cleanAvatarUrl}`;
      
    // Return the stable URL without cache busting to avoid spamming
    return baseUrl;
  }, [user?.avatarUrl]);

  if (!user) return null;

  return (
    <Avatar className={cn("bg-white/5", className)}>
      {avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
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
