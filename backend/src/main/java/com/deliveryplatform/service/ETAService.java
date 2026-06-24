package com.deliveryplatform.service;

public interface ETAService {
    /**
     * Calculates live ETA for an order based on driver's current position.
     * @param orderId The order ID
     * @param driverLat Driver's current latitude
     * @param driverLng Driver's current longitude
     */
    void updateLiveETA(java.util.UUID orderId, Double driverLat, Double driverLng);

    /**
     * Periodic check to trigger alerts for delayed deliveries.
     */
    void processDelayAlerts();

    /**
     * Calculates cascading ETA for all remaining stops of a driver.
     * @param driverId The driver ID
     * @param currentLat Driver's current latitude
     * @param currentLng Driver's current longitude
     * @return Result containing all next stops with their calculated ETAs
     */
    com.deliveryplatform.dto.response.CascadeETAResult updateCascadeETA(java.util.UUID driverId, Double currentLat, Double currentLng);
}
