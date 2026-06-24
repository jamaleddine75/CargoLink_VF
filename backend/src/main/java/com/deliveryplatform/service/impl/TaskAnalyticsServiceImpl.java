package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.OrderPriority;
import com.deliveryplatform.domain.entity.SLAStatus;
import com.deliveryplatform.dto.response.TaskAnalyticsResponse;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.service.TaskAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TaskAnalyticsServiceImpl implements TaskAnalyticsService {

    private final OrderRepository orderRepository;
    

    @Override
    @Transactional(readOnly = true)
    public TaskAnalyticsResponse getTaskAnalytics(String period) {
        List<Order> orders = getOrdersByPeriod(period);
        return calculateAnalytics(orders, period);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskAnalyticsResponse getDriverAnalytics(UUID driverId, String period) {
        List<Order> orders = getOrdersByPeriod(period).stream()
                .filter(o -> o.getDriver() != null && o.getDriver().getId().equals(driverId))
                .collect(Collectors.toList());
        return calculateAnalytics(orders, period);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskAnalyticsResponse getAgencyAnalytics(UUID agencyId, String period) {
        List<Order> orders = getOrdersByPeriod(period).stream()
                .filter(o -> o.getAgency() != null && o.getAgency().getId().equals(agencyId))
                .collect(Collectors.toList());
        return calculateAnalytics(orders, period);
    }

    @Override
    public void updateSLAStatus() {
        List<Order> allOrders = orderRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        allOrders.forEach(order -> {
            if (order.getDeadline() != null && com.deliveryplatform.domain.entity.OrderStatus.DELIVERED != order.getStatus()
                    && com.deliveryplatform.domain.entity.OrderStatus.CANCELLED != order.getStatus()) {
                if (now.isAfter(order.getDeadline())) {
                    order.setSlaStatus(SLAStatus.EXCEEDED);
                } else {
                    // Check if within 1 hour of deadline
                    long minutesUntilDeadline = ChronoUnit.MINUTES.between(now, order.getDeadline());
                    if (minutesUntilDeadline <= 60) {
                        order.setSlaStatus(SLAStatus.AT_RISK);
                    } else {
                        order.setSlaStatus(SLAStatus.ON_TRACK);
                    }
                }
                orderRepository.save(order);
            }
        });

        log.info("SLA status updated for all orders");
    }

    @Override
    @Transactional(readOnly = true)
    public long getSLAViolationCount() {
        return orderRepository.findAll().stream()
                .filter(o -> SLAStatus.EXCEEDED.equals(o.getSlaStatus()))
                .count();
    }

    @Override
    @Transactional(readOnly = true)
    public long getHighReassignmentOrderCount(int threshold) {
        return orderRepository.findAll().stream()
                .filter(o -> o.getReassignmentCount() != null && o.getReassignmentCount() > threshold)
                .count();
    }

    private List<Order> getOrdersByPeriod(String period) {
        LocalDateTime startDate = getStartDate(period);
        LocalDateTime endDate = LocalDateTime.now();

        return orderRepository.findAll().stream()
                .filter(o -> o.getCreatedAt() != null &&
                        o.getCreatedAt().isAfter(startDate) &&
                        o.getCreatedAt().isBefore(endDate))
                .collect(Collectors.toList());
    }

    private LocalDateTime getStartDate(String period) {
        LocalDateTime now = LocalDateTime.now();
        switch (period.toUpperCase()) {
            case "DAILY":
                return now.minusDays(1);
            case "WEEKLY":
                return now.minusWeeks(1);
            case "MONTHLY":
                return now.minusMonths(1);
            default:
                return now.minusDays(1);
        }
    }

    private TaskAnalyticsResponse calculateAnalytics(List<Order> orders, String period) {
        if (orders.isEmpty()) {
            return emptyAnalytics(period);
        }

        long totalOrders = orders.size();
        long completedOrders = orders.stream().filter(o -> com.deliveryplatform.domain.entity.OrderStatus.DELIVERED == o.getStatus()).count();
        long pendingOrders = orders.stream().filter(o -> !isTerminalStatus(o.getStatus())).count();
        long cancelledOrders = orders.stream().filter(o -> com.deliveryplatform.domain.entity.OrderStatus.CANCELLED == o.getStatus()).count();
        double completionRate = (double) completedOrders / totalOrders * 100;

        // Delivery time metrics
        double avgDeliveryTime = orders.stream()
                .filter(o -> o.getDeliveredAt() != null && o.getCreatedAt() != null)
                .mapToLong(o -> ChronoUnit.MINUTES.between(o.getCreatedAt(), o.getDeliveredAt()))
                .average()
                .orElse(0);

        double avgTimeToPickup = orders.stream()
                .filter(o -> o.getPickupDate() != null && o.getCreatedAt() != null)
                .mapToLong(o -> ChronoUnit.MINUTES.between(o.getCreatedAt(), o.getPickupDate()))
                .average()
                .orElse(0);

        // SLA metrics
        long slaViolations = orders.stream()
                .filter(o -> SLAStatus.EXCEEDED.equals(o.getSlaStatus()))
                .count();
        double slaComplianceRate = ((double) (totalOrders - slaViolations) / totalOrders) * 100;

        // Priority breakdown
        long lowPriority = orders.stream().filter(o -> OrderPriority.LOW.equals(o.getPriority())).count();
        long mediumPriority = orders.stream().filter(o -> OrderPriority.MEDIUM.equals(o.getPriority())).count();
        long highPriority = orders.stream().filter(o -> OrderPriority.HIGH.equals(o.getPriority())).count();
        long criticalPriority = orders.stream().filter(o -> OrderPriority.CRITICAL.equals(o.getPriority())).count();

        // Reassignment metrics
        double avgReassignments = orders.stream()
                .filter(o -> o.getReassignmentCount() != null)
                .mapToInt(Order::getReassignmentCount)
                .average()
                .orElse(0);

        long highReassignmentCount = orders.stream()
                .filter(o -> o.getReassignmentCount() != null && o.getReassignmentCount() > 2)
                .count();

        // Cost Metrics
        java.math.BigDecimal totalOrderValue = orders.stream()
                .filter(o -> o.getCodAmount() != null)
                .map(Order::getCodAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        java.math.BigDecimal averageOrderValue = orders.size() > 0 
                ? totalOrderValue.divide(java.math.BigDecimal.valueOf(orders.size()), 2, java.math.RoundingMode.HALF_UP) 
                : java.math.BigDecimal.ZERO;

        return TaskAnalyticsResponse.builder()
                .totalOrders(totalOrders)
                .completedOrders(completedOrders)
                .pendingOrders(pendingOrders)
                .cancelledOrders(cancelledOrders)
                .completionRate(completionRate)
                .averageDeliveryTime(avgDeliveryTime)
                .averageTimeToPickup(avgTimeToPickup)
                .slaViolations(slaViolations)
                .slaComplianceRate(slaComplianceRate)
                .lowPriorityCount(lowPriority)
                .mediumPriorityCount(mediumPriority)
                .highPriorityCount(highPriority)
                .criticalPriorityCount(criticalPriority)
                .averageReassignmentCount(avgReassignments)
                .highReassignmentOrders(highReassignmentCount)
                .totalOrderValue(totalOrderValue)
                .averageOrderValue(averageOrderValue)
                .costPerDelivery(completedOrders > 0 
                        ? totalOrderValue.divide(java.math.BigDecimal.valueOf(completedOrders), 2, java.math.RoundingMode.HALF_UP) 
                        : java.math.BigDecimal.ZERO)
                .lastUpdated(System.currentTimeMillis())
                .period(period)
                .build();
    }

    private TaskAnalyticsResponse emptyAnalytics(String period) {
        return TaskAnalyticsResponse.builder()
                .totalOrders(0L)
                .completedOrders(0L)
                .pendingOrders(0L)
                .cancelledOrders(0L)
                .completionRate(0.0)
                .averageDeliveryTime(0.0)
                .averageTimeToPickup(0.0)
                .slaViolations(0L)
                .slaComplianceRate(0.0)
                .lowPriorityCount(0L)
                .mediumPriorityCount(0L)
                .highPriorityCount(0L)
                .criticalPriorityCount(0L)
                .averageReassignmentCount(0.0)
                .highReassignmentOrders(0L)
                .totalOrderValue(java.math.BigDecimal.ZERO)
                .averageOrderValue(java.math.BigDecimal.ZERO)
                .costPerDelivery(java.math.BigDecimal.ZERO)
                .lastUpdated(System.currentTimeMillis())
                .period(period)
                .build();
    }

    private boolean isTerminalStatus(com.deliveryplatform.domain.entity.OrderStatus status) {
        return com.deliveryplatform.domain.entity.OrderStatus.DELIVERED == status || com.deliveryplatform.domain.entity.OrderStatus.CANCELLED == status || com.deliveryplatform.domain.entity.OrderStatus.FAILED == status;
    }
}
