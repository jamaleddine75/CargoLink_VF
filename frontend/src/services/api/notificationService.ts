import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read?: boolean;
  isRead: boolean;
  createdAt: string;
  userId?: string;
  recipientRole?: string;
  recipientEmail?: string;
  targetRoles?: string[];
  actionUrl?: string;
}

interface RawNotification extends Omit<Notification, 'isRead'> {
  isRead?: boolean;
}

const normalizeRole = (role?: string): string => {
  if (!role) return 'SYSTEM';
  const upper = role.toUpperCase();
  if (upper === 'AGENCY_ADMIN') return 'AGENCY';
  if (upper === 'CLIENT') return 'CUSTOMER';
  if (upper === 'LIVREUR') return 'DRIVER';
  return upper;
};

const normalizeNotification = (notification: RawNotification): Notification => {
  const recipientRole = normalizeRole(notification.recipientRole);
  const targetRoles = Array.isArray(notification.targetRoles) && notification.targetRoles.length > 0
    ? notification.targetRoles.map((role) => normalizeRole(role))
    : [recipientRole];

  return {
    ...notification,
    title: notification.title || notification.type || 'Notification',
    type: notification.type || 'INFO',
    recipientRole,
    targetRoles,
    isRead: typeof notification.isRead === 'boolean' ? notification.isRead : !!notification.read,
  };
};

const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get<RawNotification[]>(ENDPOINTS.NOTIFICATIONS.BASE);
    return response.data.map(normalizeNotification);
  },

  // Backward-compatible alias used by existing UI components
  getMyNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get<RawNotification[]>(ENDPOINTS.NOTIFICATIONS.BASE);
    return response.data.map(normalizeNotification);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<number>(ENDPOINTS.NOTIFICATIONS.BASE + '/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },

  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.NOTIFICATIONS.BASE + `/${id}`);
  }
};

export default notificationService;
