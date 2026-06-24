package com.deliveryplatform.service;

import java.util.UUID;

public interface AuditService {
    void logAction(UUID actorId, String action, String target, String ipAddress);
    void logOrderAction(UUID actorId, UUID orderId, String action, String details);
    void logSystemAction(String action, String details);
}
