package com.deliveryplatform.domain.entity;

public enum FinancialOutboxStatus {
    PENDING,
    PROCESSING,
    PROCESSED,
    RETRY,
    DEAD_LETTER
}
