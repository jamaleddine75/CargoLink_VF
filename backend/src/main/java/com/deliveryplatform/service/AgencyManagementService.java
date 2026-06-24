package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.*;
import java.util.List;
import java.util.UUID;

public interface AgencyManagementService {
    List<AgencyResponse> findAll();
    AgencyResponse findById(UUID id);
    AgencyMetricsResponse getMetrics(UUID id);
    List<DriverResponse> getDrivers(UUID id);
    List<OrderResponse> getOrders(UUID id);
    WalletResponse getWallet(UUID id);
    void updateCommission(UUID id, java.math.BigDecimal commission);
    void updateStatus(UUID id, String status);
    void resetAdminPassword(UUID agencyId);
    void hideAgency(UUID agencyId);
    void updateCity(UUID agencyId, String city);
}
