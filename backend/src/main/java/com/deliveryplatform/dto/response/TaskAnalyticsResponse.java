package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for order/task performance analytics and metrics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskAnalyticsResponse {

    // Overall Metrics
    private Long totalOrders;
    private Long completedOrders;
    private Long pendingOrders;
    private Long cancelledOrders;
    private Double completionRate; // Percentage

    // Performance Metrics
    private Double averageDeliveryTime; // in minutes
    private Double averageTimeToPickup; // in minutes
    private Long slaViolations; // Count of orders exceeding deadline
    private Double slaComplianceRate; // Percentage

    // Priority Breakdown
    private Long lowPriorityCount;
    private Long mediumPriorityCount;
    private Long highPriorityCount;
    private Long criticalPriorityCount;

    // Driver Performance
    private Long totalDrivers;
    private Long activeDrivers;
    private Double averageOrdersPerDriver;
    private Double averageDriverRating;

    // Agency Performance (if applicable)
    private Long totalAgencies;
    private Double averageAgencyCompletionRate;

    // Efficiency Metrics
    private Double averageReassignmentCount; // Average reassignments per order
    private Long highReassignmentOrders; // Orders reassigned more than 2 times
    private Double failureRate; // Percentage of failed deliveries

    // Cost Metrics
    private java.math.BigDecimal totalOrderValue;
    private java.math.BigDecimal averageOrderValue;
    private java.math.BigDecimal costPerDelivery;

    // Time-based Analytics
    private Long lastUpdated; // Unix timestamp
    private String period; // e.g., "DAILY", "WEEKLY", "MONTHLY"
}
