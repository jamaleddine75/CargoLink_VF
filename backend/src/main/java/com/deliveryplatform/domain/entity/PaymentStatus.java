package com.deliveryplatform.domain.entity;

public enum PaymentStatus {
    PENDING,                // Default
    COLLECTED_BY_DRIVER,    // Driver marked as cash collected
    REMITTED_TO_AGENCY,     // Driver sent remittance request
    CONFIRMED_BY_AGENCY,    // Agency admin confirmed receipt
    SETTLED_TO_CLIENT,      // Net amount paid out to client wallet
    PAID,
    CANCELLED
}
