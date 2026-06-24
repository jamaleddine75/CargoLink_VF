import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Paperclip, 
  User, 
  ShieldCheck, 
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import apiClient from '@/api/client';
import { format } from 'date-fns';
import UserAvatar from '@/components/common/UserAvatar';

interface Message {
  id: string;
  incidentId: string;
  senderId: string;
  message: string;
  createdAt: string;
  readAt?: string;
}

interface Incident {
  id: string;
  orderId: string;
  orderTrackingNumber: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface ChatProps {
  incident: Incident | null;
  onClose: () => void;
}

const SupportChatDrawer = ({ incident, onClose }: ChatProps) => {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!incident) return;

    const fetchMessages = async () => {
      try {
        const response = await apiClient.get(`/api/client/support/incidents/${incident.id}/messages`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Subscribe to incident-specific chat topic
    const topic = `/topic/incidents/${incident.id}/chat`;
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
  }, [incident, subscribe]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident || !newMessage.trim()) return;

    try {
      setLoading(true);
      await apiClient.post(`/api/client/support/incidents/${incident.id}/messages`, {
        message: newMessage.trim()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const isMyMessage = (msg: Message) => msg.senderId === user?.id;

  return (
    <AnimatePresence>
      {incident && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-[120] w-full max-w-md bg-[#020617] border-l border-white/5 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full md:hidden">
                  <X className="w-5 h-5" />
                </Button>
                <div>
                   <h3 className="text-lg font-black tracking-tighter uppercase text-white truncate max-w-[200px]">
                     {incident.title}
                   </h3>
                   <div className="flex items-center gap-2">
                     <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-black border-primary/20 text-primary px-1.5 h-4">
                       {incident.status}
                     </Badge>
                     <span className="text-[10px] font-mono text-muted-foreground">#{incident.id.slice(0, 8)}</span>
                   </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="hidden md:flex rounded-full hover:bg-white/5">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Incident Context Bar */}
            <div className="p-4 bg-primary/5 border-b border-white/5">
               <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                 <div className="flex items-center gap-1.5">
                   <Clock className="w-3 h-3" />
                   Reported {format(new Date(incident.createdAt), 'MMM dd')}
                 </div>
                 <div className="flex items-center gap-1.5">
                   <ShieldCheck className="w-3 h-3" />
                   Support Active
                 </div>
               </div>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
            >
              {/* Incident Description (First message) */}
              <div className="flex flex-col items-center gap-4 mb-8">
                 <div className="h-px w-full bg-white/5" />
                 <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest bg-[#020617] px-4 -mt-6">Ticket Created</span>
                 
                 <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                    <p className="text-white text-sm font-bold">{incident.title}</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">{incident.description}</p>
                 </div>
              </div>

              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center animate-pulse">
                    <AlertCircle className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-white font-black uppercase text-xs tracking-widest">Awaiting Support</p>
                    <p className="text-muted-foreground text-[10px] max-w-[200px]">A support agent will join the conversation shortly.</p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => {
                const isMy = isMyMessage(msg);
                const showDateHeader = i === 0 || 
                  format(new Date(msg.createdAt), 'yyyy-MM-dd') !== format(new Date(messages[i-1].createdAt), 'yyyy-MM-dd');

                return (
                  <React.Fragment key={msg.id}>
                    {showDateHeader && (
                      <div className="flex items-center justify-center gap-4 py-2">
                         <div className="h-[1px] flex-1 bg-white/5" />
                         <span className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">
                           {format(new Date(msg.createdAt), 'MMMM dd, yyyy')}
                         </span>
                         <div className="h-[1px] flex-1 bg-white/5" />
                      </div>
                    )}
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${isMy ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${isMy ? 'flex-row-reverse' : 'flex-row'}`}>
                        <UserAvatar 
                          user={(isMy ? user : { firstName: 'Support', lastName: 'Agent', role: 'ADMIN' }) as any} 
                          className="w-8 h-8 flex-shrink-0" 
                        />
                        <div className={`space-y-1 ${isMy ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isMy 
                              ? 'bg-primary text-white rounded-tr-none shadow-primary/10' 
                              : 'bg-white/10 text-white rounded-tl-none border border-white/5'
                          }`}>
                            {msg.message}
                          </div>
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[9px] font-black uppercase text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
                              {format(new Date(msg.createdAt), 'HH:mm')}
                            </span>
                            {isMy && (
                              msg.readAt ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Check className="w-3 h-3 text-muted-foreground/30" />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/5 bg-white/5 backdrop-blur-xl">
              <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl hover:bg-white/10 flex-shrink-0"
                >
                  <Paperclip className="w-5 h-5 text-muted-foreground" />
                </Button>
                
                <div className="relative flex-1">
                  <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="h-12 bg-white/5 border-white/10 rounded-2xl pr-12 focus:ring-primary/20 placeholder:text-muted-foreground/30"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-muted-foreground/20 tracking-widest">
                    Enter
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || loading}
                  className="w-12 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 flex-shrink-0 flex items-center justify-center transition-all active:scale-95"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SupportChatDrawer;
