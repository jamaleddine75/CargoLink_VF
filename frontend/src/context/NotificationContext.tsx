import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import notificationService, { Notification } from '@/services/api/notificationService';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { subscribe, connected, connectionId } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = React.useRef(false);

  const normalizeRole = useCallback((role?: string) => {
    if (!role) return 'SYSTEM';
    const upper = role.toUpperCase();
    if (upper === 'AGENCY_ADMIN') return 'AGENCY';
    if (upper === 'CLIENT') return 'CUSTOMER';
    if (upper === 'LIVREUR') return 'DRIVER';
    return upper;
  }, []);

  const normalizeIncomingNotification = useCallback((incoming: any): Notification => {
    const createdAt = incoming?.createdAt || new Date().toISOString();
    const fallbackMessage = incoming?.order?.trackingNumber
      ? `Nouvelle mission: ${incoming.order.trackingNumber}`
      : 'New notification';
    const recipientRole = normalizeRole(incoming?.recipientRole || user?.role);
    const targetRoles = Array.isArray(incoming?.targetRoles) && incoming.targetRoles.length > 0
      ? incoming.targetRoles.map((role: string) => normalizeRole(role))
      : [recipientRole];

    return {
      id: incoming?.id || `${incoming?.type || 'INFO'}-${Date.now()}`,
      title: incoming?.title || incoming?.type || 'Notification',
      message: incoming?.message || fallbackMessage,
      type: incoming?.type || 'INFO',
      isRead: typeof incoming?.isRead === 'boolean' ? incoming.isRead : false,
      createdAt,
      userId: incoming?.userId,
      recipientRole,
      recipientEmail: incoming?.recipientEmail,
      targetRoles,
      actionUrl: incoming?.actionUrl,
    };
  }, [normalizeRole, user?.role]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id || isFetchingRef.current) return;
    
    console.log("[NotificationContext] Fetching notifications for user:", user.id);
    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      const [notifs, count] = await Promise.all([
        notificationService.getMyNotifications(),
        notificationService.getUnreadCount()
      ]);
      
      setNotifications(notifs);
      setUnreadCount(count);
      console.log("[NotificationContext] Notifications fetched successfully:", notifs.length);
    } catch (err: any) {
      const errMsg = err.message || "Failed to fetch notifications";
      console.error("[NotificationContext] Error fetching notifications:", err);
      setError(errMsg);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id]); // Use user.id for stability

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id, fetchNotifications]);

  useEffect(() => {
    if (!connected || !user) return;

    // Re-fetch on each new connection so we don't miss notifications
    // that arrived while the socket was down
    fetchNotifications();

    const sub = subscribe('/user/queue/notifications', (payload: any) => {
      const newNotif = normalizeIncomingNotification(payload);

      setNotifications(prev => {
        if (prev.some(n => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });

      if (!newNotif.isRead) {
        setUnreadCount(prev => prev + 1);
      }

      fetchNotifications();

      toast.info(newNotif.message, {
        description: newNotif.type,
      });
    });

    return () => {
      if (sub && typeof sub.unsubscribe === 'function') sub.unsubscribe();
    };
  // connectionId increments on every (re)connect, ensuring re-subscription
  }, [connectionId, connected, subscribe, user, fetchNotifications, normalizeIncomingNotification]);

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    const previous = notifications;
    const target = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (target && !target.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      setNotifications(previous);
      if (target && !target.isRead) setUnreadCount(prev => prev + 1);
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      loading
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
