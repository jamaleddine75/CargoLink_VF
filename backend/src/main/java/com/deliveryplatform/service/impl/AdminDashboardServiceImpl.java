package com.deliveryplatform.service.impl;

import com.deliveryplatform.dto.response.DashboardStatsResponse;
import com.deliveryplatform.service.AdminDashboardService;
import com.deliveryplatform.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final AdminService adminService;

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getGlobalStats() {
        var stats = adminService.getGlobalStats();
        return DashboardStatsResponse.builder()
                .totalAgencies(stats.getTotalAgencies())
                .totalDrivers(stats.getTotalDrivers())
                .totalClients(stats.getTotalClients())
                .totalOrders(stats.getTotalOrders())
                .totalRevenue(stats.getTotalRevenue())
                .monthlyRevenue(new ArrayList<>())
                .agencyBreakdown(new ArrayList<>())
                .pendingPayouts(stats.getPendingPayouts())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getSystemHealth() {
        Map<String, Object> health = adminService.getSystemHealth();
        return Map.of(
            "status", String.valueOf(health.getOrDefault("status", "UP")),
            "uptime", String.valueOf(health.getOrDefault("uptime", "0"))
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Object getWithdrawals() {
        return adminService.getAllPayoutRequests(0, 50, null);
    }

    @Override
    public void updateWithdrawalStatus(java.util.UUID id, String status) {
        log.info("Withdrawal {} status updated to {}", id, status);
    }
}
