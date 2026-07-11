package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.DriverResponse;
import com.deliveryplatform.dto.response.DriverDashboardStatsResponse;
import com.deliveryplatform.dto.response.DriverStatsResponse;
import com.deliveryplatform.dto.request.UpdateDriverProfileRequest;

/**
 * Service interface for Driver management.
 */
public interface DriverService {
    DriverResponse getDriverProfile(java.util.UUID driverId);
    DriverResponse getDriverById(java.util.UUID id, java.util.UUID authenticatedUserId, String role, java.util.UUID agencyId);
    DriverResponse updateDriverProfile(java.util.UUID driverId, UpdateDriverProfileRequest driverResponse);
    DriverResponse updateDriverStatus(java.util.UUID driverId, String status);
    DriverStatsResponse getDriverStats(java.util.UUID driverId, String period);
    DriverDashboardStatsResponse getDriverDashboard(java.util.UUID userId);
    DriverResponse updateVehicleInfo(java.util.UUID driverId, String vehiclePlate);
    Boolean isDriverAvailable(java.util.UUID driverId);
    void assignOrder(java.util.UUID driverId, java.util.UUID orderId);
    Double getDriverEfficiency(java.util.UUID driverId);
    java.util.List<DriverResponse> getAllDrivers();
    DriverResponse getPreferences(java.util.UUID userId);
    DriverResponse updatePreferences(java.util.UUID userId, DriverResponse prefs);
}
