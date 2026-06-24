package com.deliveryplatform.domain.entity;

public enum OrderStatus {
    PENDING,
    VALIDATED,
    ASSIGNED,
    PICKUP_READY,
    PICKED_UP,
    ON_THE_WAY,
    DELIVERED,
    FAILED,
    CANCELLED,
    RETURNED
}
