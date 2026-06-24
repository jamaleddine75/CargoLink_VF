package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);
    List<Notification> findTop50ByRecipientIdOrderByCreatedAtDesc(UUID recipientId);
    List<Notification> findTop50ByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(UUID recipientId);
    long countByRecipientIdAndIsReadFalse(UUID recipientId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient.id = :recipientId AND n.isRead = false")
    void markAllAsRead(UUID recipientId);
}