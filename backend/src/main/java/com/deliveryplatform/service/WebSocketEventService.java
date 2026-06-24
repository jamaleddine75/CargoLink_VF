package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.OrderResponse;

import java.util.UUID;

/**
 * Centralized WebSocket event broadcasting service.
 * All realtime event emissions go through this service to ensure:
 * - Consistent destination naming
 * - Proper error isolation (WS failures never break business logic)
 * - Centralized logging for tracing realtime issues
 * - Targeted user events (no unnecessary global broadcasts)
 */
public interface WebSocketEventService {

    // ── Order Events ──────────────────────────────────────────────────────────

    /** Broadcast an order update to all subscribers watching this specific order + admin feed. */
    void broadcastOrderUpdate(UUID orderId, OrderResponse response);

    /** Broadcast that a new order has been created (for drivers and admin). */
    void broadcastNewOrder(OrderResponse response);

    /** Broadcast that an order is available for pickup (returned to pool). */
    void broadcastOrderAvailable(OrderResponse response);

    // ── Driver Events ─────────────────────────────────────────────────────────

    /** Broadcast a driver status change to admin dashboards. */
    void broadcastDriverStatusChange(UUID driverId, String newStatus, Object driverInfo);

    // ── Admin Events ──────────────────────────────────────────────────────────

    /** Trigger a dashboard refresh event for admin clients. */
    void broadcastAdminDashboardRefresh(String reason);

    // ── Incident Events ──────────────────────────────────────────────────────

    /** Broadcast an incident event to admin dashboards. */
    void broadcastIncidentEvent(UUID orderId, String action, Object incidentData);

    // ── User-Targeted Events ──────────────────────────────────────────────────

    /** Send a notification payload to a specific user. */
    void sendUserNotification(UUID userId, Object payload);

    /** Send a force-logout command to a specific user. */
    void sendForceLogout(UUID userId, String reason);

    /** Send a targeted event to a specific user on a custom sub-topic. */
    void sendUserEvent(UUID userId, String subTopic, Object payload);

    /** Broadcast a chat message to all participants of an incident. */
    void broadcastIncidentChatMessage(UUID incidentId, Object message);

    /** Broadcast an incident status update to both admin and the specific client. */
    void broadcastIncidentStatusUpdate(UUID incidentId, UUID clientId, Object incidentData);
}
