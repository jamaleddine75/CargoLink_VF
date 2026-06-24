import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Check, CheckCheck, Clock, User, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import apiClient from '@/api/client';
import { format } from 'date-fns';
import UserAvatar from '@/components/common/UserAvatar';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  incidentId: string;
  senderId: string;
  message: string;
  createdAt: string;
  readAt?: string;
}

interface AdminChatProps {
  incidentId: string;
}

export function AdminChat({ incidentId }: AdminChatProps) {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await apiClient.get(`/incidents/${incidentId}/messages`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    const topic = `/topic/incidents/${incidentId}/chat`;
    const subscription = subscribe(topic, (event: any) => {
      if (event.type === 'CHAT_MESSAGE') {
        setMessages(prev => [...prev, event.data]);
      }
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [incidentId, subscribe]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setLoading(true);
      await apiClient.post(`/incidents/${incidentId}/messages`, {
        message: newMessage.trim()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-accent/5 rounded-3xl border border-border/20 overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-[300px]"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
            <User className="w-8 h-8 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">No conversation history</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMy = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={cn("flex", isMy ? "justify-end" : "justify-start")}>
              <div className={cn("flex gap-2 max-w-[85%]", isMy ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "px-3 py-2 rounded-2xl text-xs font-medium leading-relaxed",
                  isMy ? "bg-primary text-white rounded-tr-none" : "bg-accent/40 dark:bg-accent/20 text-foreground dark:text-foreground/80 rounded-tl-none border border-border/40 dark:border-border/20"
                )}>
                  {msg.message}
                  <div className={cn("text-[8px] font-black uppercase tracking-widest mt-1 opacity-50 text-right")}>
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-accent/10 border-t border-border/20 flex gap-2">
        <Input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a reply..."
          className="h-10 rounded-xl bg-background/50 border-border/30 text-xs font-bold"
        />
        <Button 
          type="submit" 
          disabled={!newMessage.trim() || loading}
          size="icon"
          className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-white shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
