package com.deliveryplatform.scheduler;

import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.OrderStatus;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.service.AssignmentService;
import com.deliveryplatform.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DispatchScheduler {

    private final OrderRepository orderRepository;
    private final AssignmentService assignmentService;
    private final OrderService orderService;

    @Scheduled(fixedDelay = 30000)
    public void retryPendingAssignments() {
        List<Order> pendingOrders = orderRepository.findByStatus(OrderStatus.PENDING);
        
        if (pendingOrders.isEmpty()) return;

        log.info("Scheduler: Retrying dispatch for {} pending orders", pendingOrders.size());
        
        for (Order order : pendingOrders) {
            try {
                assignmentService.autoAssignDriver(order.getId());
            } catch (Exception e) {
                log.error("Scheduler Error: Failed to re-dispatch order {}: {}", order.getId(), e.getMessage());
            }
        }
    }

    @Scheduled(fixedDelay = 60000)
    public void monitorSLA() {
        log.debug("Scheduler: Monitoring SLA for active orders");
        orderService.updateSLAStatuses();
    }
}
