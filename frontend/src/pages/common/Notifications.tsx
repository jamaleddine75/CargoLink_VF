import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Info,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import notificationService, { Notification } from '@/services/api/notificationService';
import { toast } from 'sonner';
import { useNotifications } from '@/context/NotificationContext';



const Notifications = () => {
    const navigate = useNavigate();
    const { notifications, markAsRead, markAllAsRead, deleteNotification, loading, fetchNotifications } = useNotifications();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        const markAll = async () => {
            if (notifications.some(n => !n.isRead)) {
                await markAllAsRead();
            }
        };
        markAll();
    }, [notifications, markAllAsRead]);

    const getIcon = (type: string) => {

        switch (type?.toUpperCase()) {
            case 'SUCCESS': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'WARNING': return <AlertCircle className="w-5 h-5 text-amber-500" />;
            case 'ERROR': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'INFO': return <Info className="w-5 h-5 text-blue-500" />;
            default: return <Bell className="w-5 h-5 text-primary" />;
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate(-1)}
                        className="rounded-full"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl font-bold gap-2"
                        onClick={markAllAsRead}
                    >
                        <CheckCheck className="w-4 h-4" />
                        Mark all as read
                    </Button>
                )}

            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                        <Bell className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">No new notifications</h2>
                    <p className="text-muted-foreground max-w-xs">
                        You're all caught up! When you get new updates, they'll appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence initial={false}>
                        {notifications.map((notification) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                layout
                            >
                                <Card className={`border-none shadow-sm transition-all hover:shadow-md ${notification.isRead ? 'bg-card/50 opacity-80' : 'bg-card ring-1 ring-primary/10'}`}>
                                    <CardContent className="p-4 flex items-start gap-4">
                                        <div className={`mt-1 p-2 rounded-xl ${notification.isRead ? 'bg-muted' : 'bg-primary/10'}`}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-bold ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                        {notification.title || notification.type || 'Update'}
                                                    </p>
                                                    {notification.targetRoles?.[0] && (
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                                                            {notification.targetRoles[0]}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(notification.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <p className={`text-sm ${notification.isRead ? 'text-muted-foreground' : 'text-foreground/80'}`}>
                                                {notification.message}
                                            </p>
                                            {!notification.isRead && (
                                                <Button 
                                                    variant="link" 
                                                    size="sm" 
                                                    className="p-0 h-auto text-xs font-bold text-primary"
                                                    onClick={() => markAsRead(notification.id)}

                                                >
                                                    Mark as read
                                                </Button>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full text-muted-foreground hover:text-red-500"
                                            disabled={deletingId === notification.id}
                                            onClick={async () => {
                                                setDeletingId(notification.id);
                                                try {
                                                    await deleteNotification(notification.id);
                                                } catch {
                                                    toast.error('Impossible de supprimer la notification');
                                                } finally {
                                                    setDeletingId(null);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default Notifications;
