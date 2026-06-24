package com.deliveryplatform.controller;

import com.deliveryplatform.dto.response.DashboardStatsResponse;
import com.deliveryplatform.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        return ResponseEntity.ok(dashboardService.getGlobalStats());
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> getSystemHealth() {
        return ResponseEntity.ok(dashboardService.getSystemHealth());
    }

    @GetMapping("/withdrawals")
    public ResponseEntity<?> getWithdrawalRequests() {
        return ResponseEntity.ok(dashboardService.getWithdrawals());
    }

    @PutMapping("/withdrawals/{id}/status")
    public ResponseEntity<Void> updateWithdrawalStatus(@PathVariable java.util.UUID id, @RequestBody String status) {
        dashboardService.updateWithdrawalStatus(id, status);
        return ResponseEntity.ok().build();
    }
}
