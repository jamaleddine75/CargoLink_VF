package com.deliveryplatform.event;

import com.deliveryplatform.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderAssignmentListener {

    private final AssignmentService assignmentService;

    @Async
    @EventListener
    public void handleOrderCreatedEvent(OrderCreatedEvent event) {
        log.info("OrderCreatedEvent received for order {}. Triggering auto-assignment.", event.getOrderId());
        assignmentService.autoAssignDriver(event.getOrderId());
    }
}
