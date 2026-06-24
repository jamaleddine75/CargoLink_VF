package com.deliveryplatform.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class OrderCreatedEvent extends ApplicationEvent {
    private final java.util.UUID orderId;

    public OrderCreatedEvent(Object source, java.util.UUID orderId) {
        super(source);
        this.orderId = orderId;
    }
}
