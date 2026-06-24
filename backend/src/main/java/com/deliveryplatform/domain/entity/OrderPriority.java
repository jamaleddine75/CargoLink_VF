package com.deliveryplatform.domain.entity;

/**
 * Represents the priority level of an Order.
 */
public enum OrderPriority {
    LOW(1),
    MEDIUM(2),
    HIGH(3),
    CRITICAL(4);

    private final int level;

    OrderPriority(int level) {
        this.level = level;
    }

    public int getLevel() {
        return level;
    }
}
