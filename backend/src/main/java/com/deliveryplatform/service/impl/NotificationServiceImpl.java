package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.Notification;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.domain.entity.Role;
import com.deliveryplatform.dto.response.NotificationResponse;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.mapper.NotificationMapper;
import com.deliveryplatform.repository.NotificationRepository;
import com.deliveryplatform.repository.UserRepository;
import com.deliveryplatform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.deliveryplatform.domain.entity.Order;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void createNotification(UUID recipientId, String message, String type) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", recipientId));

        Notification notification = Notification.builder()
                .recipient(recipient)
                .title(type != null ? type : "Notification")
                .message(message)
                .type(type)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        notificationRepository.save(notification);
        log.info("Notification created and broadcasting for user {}: {}", recipientId, message);

        // Real-time broadcast via WebSocket (topic-based targeting)
        try {
            messagingTemplate.convertAndSend(
                "/topic/notifications/" + recipientId,
                notificationMapper.toResponse(notification)
            );
        } catch (Exception e) {
            log.warn("Failed to broadcast notification to user {}: {}", recipientId, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotifications(UUID recipientId) {
        return notificationRepository.findTop50ByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(recipientId).stream()
                .map(notificationMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getAllNotifications(UUID recipientId) {
        log.debug("[Notifications] Querying top 50 notifications for user: {}", recipientId);
        return notificationRepository.findTop50ByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .map(notificationMapper::toResponse)
                .collect(Collectors.toList());
    }


    @Override
    public void markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID recipientId) {
        notificationRepository.markAllAsRead(recipientId);
        log.info("All notifications marked as read for user {}", recipientId);
    }


    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID recipientId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(recipientId);
    }

    @Override
    @Transactional
    public void broadcastNotification(String title, String message, String type, String targetRole) {
        List<User> recipients;
        if (targetRole != null && !targetRole.equalsIgnoreCase("ALL")) {
            try {
                Role role = Role.fromString(targetRole);
                recipients = role != null ? userRepository.findByRole(role) : userRepository.findAll();
            } catch (Exception e) {
                log.warn("Invalid role for broadcast: {}", targetRole);
                recipients = userRepository.findAll();
            }
        } else {
            recipients = userRepository.findAll();
        }

        List<Notification> notifications = recipients.stream()
                .map(user -> Notification.builder()
                        .recipient(user)
                        .title(title)
                        .message(message)
                        .type(type)
                        .isRead(false)
                        .createdAt(java.time.LocalDateTime.now())
                        .build())
                .collect(Collectors.toList());

        notificationRepository.saveAll(notifications);

        // Realtime: Push notification to each recipient via topic-based WebSocket
        for (Notification notification : notifications) {
            try {
                messagingTemplate.convertAndSend(
                    "/topic/notifications/" + notification.getRecipient().getId(),
                    notificationMapper.toResponse(notification)
                );
            } catch (Exception e) {
                log.warn("Failed to WS-push broadcast notification to user {}: {}",
                    notification.getRecipient().getId(), e.getMessage());
            }
        }

        log.info("Broadcasted notification '{}' to {} users", title, recipients.size());
    }

    @Override
    public void sendOrderOffer(UUID driverUserId, Order order) {
        log.info("Sending mission offer for order {} to user {}", order.getTrackingNumber(), driverUserId);
        User driverUser = userRepository.findById(driverUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", driverUserId));

        String offerMessage = "Nouvelle mission disponible : " + order.getTrackingNumber();
        Notification persistedNotification = Notification.builder()
                .recipient(driverUser)
                .title("ORDER_OFFER")
                .message(offerMessage)
                .type("ORDER_OFFER")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        persistedNotification = notificationRepository.save(persistedNotification);
        
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("type", "ORDER_OFFER");
        payload.put("id", persistedNotification.getId());
        payload.put("title", persistedNotification.getTitle());
        payload.put("message", persistedNotification.getMessage());
        payload.put("isRead", false);
        payload.put("createdAt", persistedNotification.getCreatedAt().toString());
        java.util.Map<String, Object> orderMap = new java.util.HashMap<>();
        orderMap.put("id", order.getId());
        orderMap.put("trackingNumber", order.getTrackingNumber());
        orderMap.put("pickupAddress", order.getPickupAddress());
        orderMap.put("deliveryAddress", order.getDeliveryAddress());
        orderMap.put("pickupLat", order.getPickupLat());
        orderMap.put("pickupLng", order.getPickupLng());
        orderMap.put("deliveryLat", order.getDeliveryLat());
        orderMap.put("deliveryLng", order.getDeliveryLng());
        orderMap.put("codAmount", order.getCodAmount() != null ? order.getCodAmount() : java.math.BigDecimal.ZERO);
        orderMap.put("deliveryFee", order.getDeliveryFee() != null ? order.getDeliveryFee() : java.math.BigDecimal.ZERO);
        orderMap.put("driverEarnings", order.getDriverEarnings() != null ? order.getDriverEarnings() : java.math.BigDecimal.ZERO);
        orderMap.put("distance", order.getDistance() != null ? order.getDistance() : 0.0);
        orderMap.put("urgent", order.isUrgent());
        orderMap.put("heavy", order.isHeavy());
        payload.put("order", orderMap);
        payload.put("timeoutSeconds", 30);
        payload.put("timestamp", LocalDateTime.now().toString());

        messagingTemplate.convertAndSend(
            "/topic/notifications/" + driverUserId,
            payload
        );
    }
}
