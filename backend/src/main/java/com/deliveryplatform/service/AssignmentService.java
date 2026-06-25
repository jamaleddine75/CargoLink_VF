package com.deliveryplatform.service;

import java.util.UUID;

public interface AssignmentService {
    void autoAssignDriver(java.util.UUID orderId);
    void manualAssignDriver(java.util.UUID orderId, UUID driverId);
}
