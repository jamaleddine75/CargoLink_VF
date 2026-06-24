package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.TaskAnalyticsResponse;

/**
 * Service for calculating order/task performance analytics and metrics.
 */
public interface TaskAnalyticsService {

    /**
     * Get overall task analytics for all orders.
     *
     * @param period - "DAILY", "WEEKLY", or "MONTHLY"
     * @return TaskAnalyticsResponse with comprehensive metrics
     */
    TaskAnalyticsResponse getTaskAnalytics(String period);

    /**
     * Get task analytics filtered by driver.
     *
     * @param driverId - UUID of the driver
     * @param period - "DAILY", "WEEKLY", or "MONTHLY"
     * @return TaskAnalyticsResponse with driver-specific metrics
     */
    TaskAnalyticsResponse getDriverAnalytics(java.util.UUID driverId, String period);

    /**
     * Get task analytics filtered by agency.
     *
     * @param agencyId - UUID of the agency
     * @param period - "DAILY", "WEEKLY", or "MONTHLY"
     * @return TaskAnalyticsResponse with agency-specific metrics
     */
    TaskAnalyticsResponse getAgencyAnalytics(java.util.UUID agencyId, String period);

    /**
     * Calculate and update SLA status for all orders.
     * This should be called periodically (e.g., every 5 minutes via scheduler).
     */
    void updateSLAStatus();

    /**
     * Get SLA violation report - orders that missed or are about to miss deadline.
     *
     * @return count of SLA violations
     */
    long getSLAViolationCount();

    /**
     * Get high reassignment orders - orders reassigned more than threshold times.
     *
     * @param threshold - minimum reassignment count
     * @return list of order IDs
     */
    long getHighReassignmentOrderCount(int threshold);
}
