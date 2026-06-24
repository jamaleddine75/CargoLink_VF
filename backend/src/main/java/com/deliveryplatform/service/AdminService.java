package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface AdminService {

    AdminStatsResponse getGlobalStats();

    PagedResponse<AgencyResponse> getAllAgencies(int page, int size);

    AgencyResponse getAgencyById(UUID id);

    AgencyResponse createAgency(com.deliveryplatform.dto.request.AgencyCreateRequest request);

    AgencyResponse updateAgency(UUID id, com.deliveryplatform.dto.request.AgencyUpdateRequest request);

    void suspendAgency(UUID id, String reason);

    void activateAgency(UUID id);

    void setCommissionRate(UUID agencyId, java.math.BigDecimal rate);

    PagedResponse<?> getAllWallets(int page, int size);

    Map<String, Object> getAgencyWallet(UUID agencyId);

    void setPricingConfig(Map<String, Object> config);

    Map<String, Object> getSystemHealth();

    PagedResponse<?> getAllPayoutRequests(int page, int size, String status);

    void approvePayout(UUID payoutId);

    void rejectPayout(UUID payoutId, String reason);

    List<?> getGlobalLiveDrivers(UUID agencyId);

    List<?> getGlobalLiveOrders(UUID agencyId);

    Map<String, Object> getFinanceSummary();

    List<Map<String, Object>> getRegionSummary();

    void reassignDriverToAgency(UUID driverId, UUID agencyId);

    List<Map<String, Object>> getOrphanDrivers();
}
