package com.deliveryplatform.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface RouteOptimisationService {
    


    /**
     * Advanced optimization using 2-Opt with Pickup & Delivery constraints and priorities.
     * @param driverId Driver to optimize for
     * @param orderIds List of orders assigned to this driver
     * @return Ordered list of RouteStopDTOs
     */
    List<com.deliveryplatform.dto.response.RouteStopDTO> optimizeDriverRouteWithStops(UUID driverId, List<java.util.UUID> orderIds);
}
