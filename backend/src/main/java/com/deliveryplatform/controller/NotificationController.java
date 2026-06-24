package com.deliveryplatform.controller;

import com.deliveryplatform.dto.response.NotificationResponse;
import com.deliveryplatform.security.UserPrincipal;
import com.deliveryplatform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        log.info("[Notifications] Fetching all notifications for user: {}", principal.getId());
        return ResponseEntity.ok(notificationService.getAllNotifications(principal.getId()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<NotificationResponse>> getMyNotificationsAlt(@AuthenticationPrincipal UserPrincipal principal) {
        log.info("[Notifications] Fetching all notifications (alt) for user: {}", principal.getId());
        return ResponseEntity.ok(notificationService.getAllNotifications(principal.getId()));
    }


    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        log.info("[Notifications] Fetching unread count for user: {}", principal.getId());
        return ResponseEntity.ok(notificationService.getUnreadCount(principal.getId()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok().build();
    }


    @PostMapping("/admin/notifications/broadcast")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN')")
    public ResponseEntity<Void> broadcast(@RequestBody Map<String, Object> payload) {
        String title = payload.get("title") != null ? payload.get("title").toString() : null;
        String message = payload.get("message") != null ? payload.get("message").toString() : null;
        String type = payload.get("type") != null ? payload.get("type").toString() : "INFO";

        Object rolesRaw = payload.get("targetRoles");
        if (rolesRaw instanceof java.util.List<?> rolesList && !rolesList.isEmpty()) {
            for (Object roleObj : rolesList) {
                if (roleObj != null) {
                    notificationService.broadcastNotification(title, message, type, roleObj.toString());
                }
            }
        } else {
            String targetRole = payload.get("targetRole") != null ? payload.get("targetRole").toString() : "ALL";
            notificationService.broadcastNotification(title, message, type, targetRole);
        }
        return ResponseEntity.ok().build();
    }
}