package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.NotificationResponse;
import java.util.List;
import java.util.UUID;

public interface NotificationService {
    void createNotification(UUID recipientId, String message, String type);
    List<NotificationResponse> getUnreadNotifications(UUID recipientId);
    List<NotificationResponse> getAllNotifications(UUID recipientId);
    void markAsRead(UUID notificationId);
    void markAllAsRead(UUID recipientId);
    long getUnreadCount(UUID recipientId);

    void broadcastNotification(String title, String message, String type, String targetRole);
    void sendOrderOffer(UUID driverUserId, com.deliveryplatform.domain.entity.Order order);
}