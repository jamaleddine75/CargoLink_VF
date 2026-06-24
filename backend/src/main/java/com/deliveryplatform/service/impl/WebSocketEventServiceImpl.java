package com.deliveryplatform.service.impl;

import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.service.WebSocketEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Production-grade centralized WebSocket event broadcaster.
 *
 * Design decisions:
 * - Every send is wrapped in try/catch so a WebSocket failure NEVER breaks business logic.
 * - Uses topic-based user targeting (/topic/notifications/{userId}) instead of /user/ prefix
 *   because the STOMP principal is email-based (from JWT), not UUID-based.
 * - Consistent destination naming across the entire application.
 * - Structured payloads with event type and timestamp for frontend discrimination.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventServiceImpl implements WebSocketEventService {

    private final SimpMessagingTemplate messagingTemplate;

    // ── Destination Constants ─────────────────────────────────────────────────
    private static final String TOPIC_ORDER_PREFIX = "/topic/orders/";
    private static final String TOPIC_ORDERS_NEW = "/topic/orders/new";
    private static final String TOPIC_ORDERS_AVAILABLE = "/topic/orders/available";
    private static final String TOPIC_ADMIN_ORDERS = "/topic/admin/orders";
    private static final String TOPIC_ADMIN_DRIVERS = "/topic/admin/drivers";
    private static final String TOPIC_ADMIN_DASHBOARD = "/topic/admin/dashboard";
    private static final String TOPIC_NOTIFICATIONS_PREFIX = "/topic/notifications/";
    private static final String TOPIC_FORCE_LOGOUT_PREFIX = "/topic/force-logout/";

    // ── Order Events ──────────────────────────────────────────────────────────

    @Override
    public void broadcastOrderUpdate(UUID orderId, OrderResponse response) {
        // 1. Send to order-specific topic (anyone watching this order)
        send(TOPIC_ORDER_PREFIX + orderId, wrapEvent("ORDER_UPDATED", response));
        // 2. Send to admin global order feed
        send(TOPIC_ADMIN_ORDERS, wrapEvent("ORDER_UPDATED", response));
        log.debug("[WS] Order update broadcast: orderId={}, status={}", orderId,
                response != null ? response.getStatus() : "null");
    }

    @Override
    public void broadcastNewOrder(OrderResponse response) {
        // 1. Send to new order topic (drivers listening for offers)
        send(TOPIC_ORDERS_NEW, wrapEvent("ORDER_CREATED", response));
        // 2. Send to admin order feed
        send(TOPIC_ADMIN_ORDERS, wrapEvent("ORDER_CREATED", response));
        // 3. Trigger admin dashboard refresh
        broadcastAdminDashboardRefresh("NEW_ORDER");
        log.debug("[WS] New order broadcast: trackingNumber={}",
                response != null ? response.getTrackingNumber() : "null");
    }

    @Override
    public void broadcastOrderAvailable(OrderResponse response) {
        send(TOPIC_ORDERS_AVAILABLE, wrapEvent("ORDER_AVAILABLE", response));
        log.debug("[WS] Order available broadcast: orderId={}",
                response != null ? response.getId() : "null");
    }

    // ── Driver Events ─────────────────────────────────────────────────────────

    @Override
    public void broadcastDriverStatusChange(UUID driverId, String newStatus, Object driverInfo) {
        Map<String, Object> payload = Map.of(
                "type", "DRIVER_STATUS_CHANGED",
                "driverId", driverId.toString(),
                "status", newStatus,
                "driverInfo", driverInfo != null ? driverInfo : Map.of(),
                "timestamp", LocalDateTime.now().toString()
        );
        send(TOPIC_ADMIN_DRIVERS, payload);
        log.debug("[WS] Driver status change broadcast: driverId={}, status={}", driverId, newStatus);
    }

    // ── Admin Events ──────────────────────────────────────────────────────────

    @Override
    public void broadcastAdminDashboardRefresh(String reason) {
        Map<String, Object> payload = Map.of(
                "type", "DASHBOARD_REFRESH",
                "reason", reason != null ? reason : "UNKNOWN",
                "timestamp", LocalDateTime.now().toString()
        );
        send(TOPIC_ADMIN_DASHBOARD, payload);
    }

    // ── Incident Events ───────────────────────────────────────────────────────

    @Override
    public void broadcastIncidentEvent(UUID orderId, String action, Object incidentData) {
        Map<String, Object> payload = Map.of(
                "type", "INCIDENT_" + (action != null ? action.toUpperCase() : "UPDATE"),
                "orderId", orderId != null ? orderId.toString() : "",
                "data", incidentData != null ? incidentData : Map.of(),
                "timestamp", LocalDateTime.now().toString()
        );
        send(TOPIC_ADMIN_DASHBOARD, payload);
        log.debug("[WS] Incident event broadcast: orderId={}, action={}", orderId, action);
    }

    // ── User-Targeted Events ──────────────────────────────────────────────────

    @Override
    public void sendUserNotification(UUID userId, Object payload) {
        // Using topic-based targeting instead of /user/ prefix
        // because our STOMP principal uses email, not UUID
        send(TOPIC_NOTIFICATIONS_PREFIX + userId, payload);
        log.debug("[WS] User notification sent: userId={}", userId);
    }

    @Override
    public void sendForceLogout(UUID userId, String reason) {
        Map<String, Object> payload = Map.of(
                "type", "FORCE_LOGOUT",
                "reason", reason != null ? reason : "Account suspended",
                "timestamp", LocalDateTime.now().toString()
        );
        send(TOPIC_FORCE_LOGOUT_PREFIX + userId, payload);
        log.info("[WS] Force logout sent to user {}: {}", userId, reason);
    }

    @Override
    public void sendUserEvent(UUID userId, String subTopic, Object payload) {
        String destination = TOPIC_NOTIFICATIONS_PREFIX + userId + "/" + subTopic;
        send(destination, payload);
    }

    @Override
    public void broadcastIncidentChatMessage(UUID incidentId, Object message) {
        String destination = "/topic/incidents/" + incidentId + "/chat";
        send(destination, wrapEvent("CHAT_MESSAGE", message));
        // Also notify admin dashboard for counters etc
        send(TOPIC_ADMIN_DASHBOARD, wrapEvent("INCIDENT_CHAT_NEW", Map.of("incidentId", incidentId)));
    }

    @Override
    public void broadcastIncidentStatusUpdate(UUID incidentId, UUID clientId, Object incidentData) {
        // 1. Notify admin
        send(TOPIC_ADMIN_DASHBOARD, wrapEvent("INCIDENT_STATUS_UPDATED", incidentData));
        // 2. Notify specific client
        if (clientId != null) {
            send(TOPIC_NOTIFICATIONS_PREFIX + clientId, wrapEvent("INCIDENT_STATUS_UPDATED", incidentData));
        }
    }

    // ── Internal Helpers ──────────────────────────────────────────────────────

    /**
     * Safe send — NEVER throws. WS failure is logged but does not propagate.
     */
    private void send(String destination, Object payload) {
        try {
            messagingTemplate.convertAndSend(destination, payload);
        } catch (Exception e) {
            log.warn("[WS] Failed to send to {}: {}", destination, e.getMessage());
        }
    }

    /**
     * Wraps a payload in a standard event envelope with type and timestamp.
     */
    private Map<String, Object> wrapEvent(String type, Object data) {
        return Map.of(
                "type", type,
                "data", data != null ? data : Map.of(),
                "timestamp", LocalDateTime.now().toString()
        );
    }
}
