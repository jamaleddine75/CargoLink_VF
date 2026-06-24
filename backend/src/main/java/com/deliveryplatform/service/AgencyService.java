package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.AgencyMetricsResponse;
import com.deliveryplatform.dto.response.AgencyResponse;
import com.deliveryplatform.dto.response.DriverResponse;
import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.dto.response.PagedResponse;
import com.deliveryplatform.dto.response.DriverDisciplinaryHistoryResponse;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for Agency management.
 */
public interface AgencyService {
    List<AgencyResponse> getAllAgencies();
    AgencyResponse getAgencyById(UUID id, UUID userId, String role);
    AgencyMetricsResponse getAgencyMetrics(UUID id, UUID userId, String role);
    List<DriverResponse> getAgencyDrivers(UUID id, UUID userId, String role);
    PagedResponse<OrderResponse> getAgencyOrders(UUID id, String status, Integer page, Integer size, UUID userId, String role);
    PagedResponse<OrderResponse> getOrdersByCity(UUID agencyId, String city, String type, String status, Integer page, Integer size, UUID userId, String role);
    OrderResponse getOrderById(UUID orderId, UUID agencyId, UUID userId, String role);
    void hideAgency(UUID id);
    
    // Agency Admin Workflow
    void validateDelivery(java.util.UUID orderId, UUID agencyId, UUID userId, String role);
    java.util.Map<String, Object> confirmCashPayment(java.util.UUID orderId, UUID userId, String role);
    
    java.util.Map<String, Object> confirmCODRemittance(UUID transactionId, UUID agencyId, UUID userId, String role);
    java.util.List<?> getPendingRemittances(UUID agencyId, UUID userId, String role);
    java.util.Map<String, Object> getAgencyWalletBalance(UUID agencyId, UUID userId, String role);
    java.util.List<?> getCommissions(UUID agencyId, UUID userId, String role);
    java.util.List<?> getPayouts(UUID agencyId, UUID userId, String role);
    void requestPayout(UUID agencyId, java.math.BigDecimal amount, String bankAccount, UUID userId, String role);
    void setCommissionRate(UUID agencyId, java.math.BigDecimal rate);
    
    void updateAgencySettings(UUID agencyId, com.deliveryplatform.dto.request.AgencySettingsRequest request, UUID userId, String role);
    
    byte[] generateCODExport(UUID agencyId, String status, String startDate, String endDate, String format, UUID userId, String role);

    // Disciplinary Management
    void suspendDriver(UUID driverId, UUID agencyId, String reason, UUID performerId, String role);
    void reactivateDriver(UUID driverId, UUID agencyId, String reason, UUID performerId, String role);
    void blacklistDriver(UUID driverId, UUID agencyId, String reason, UUID performerId, String role);
    List<DriverDisciplinaryHistoryResponse> getDriverDisciplinaryHistory(UUID driverId, UUID agencyId, UUID performerId, String role);

    // Work Permit Management
    DriverResponse extendWorkPermission(UUID driverId, UUID agencyId, UUID performerId, String role);
}