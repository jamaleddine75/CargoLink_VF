package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.DashboardStatsResponse;
import java.util.Map;
import java.util.UUID;

public interface AdminDashboardService {
    DashboardStatsResponse getGlobalStats();
    Map<String, String> getSystemHealth();
    Object getWithdrawals();
    void updateWithdrawalStatus(UUID id, String status);
}
