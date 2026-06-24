package com.deliveryplatform.domain.entity;

/**
 * Represents the SLA (Service Level Agreement) status of an Order.
 */
public enum SLAStatus {
    ON_TRACK,      // Order is progressing normally
    AT_RISK,       // Order may miss deadline
    EXCEEDED       // Order exceeded deadline
}
