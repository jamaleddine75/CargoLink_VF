package com.deliveryplatform.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface RouteOptimisationService {
    
    /**
     * Clusters all pending orders by geographical zone.
     * @param clusterCount Number of clusters to create
     * @return Map of cluster index to list of Order IDs
     */
    Map<Integer, List<java.util.UUID>> clusterOrders(int clusterCount);

    /**
     * Optimizes the sequence of stops for a specific driver.
     * @param driverId Driver to optimize for
     * @param orderIds List of orders assigned to this driver
     * @return Ordered list of Order IDs
     */
    List<java.util.UUID> optimizeDriverRoute(UUID driverId, List<java.util.UUID> orderIds);

    /**
     * Performs a global batch optimization: clustering and assigning to nearest drivers.
     */
    com.deliveryplatform.dto.response.BatchOptimizationResult performGlobalBatchOptimization();

    /**
     * Advanced optimization using 2-Opt with Pickup & Delivery constraints and priorities.
     * @param driverId Driver to optimize for
     * @param orderIds List of orders assigned to this driver
     * @return Ordered list of RouteStopDTOs
     */
    List<com.deliveryplatform.dto.response.RouteStopDTO> optimizeDriverRouteWithStops(UUID driverId, List<java.util.UUID> orderIds);
}
