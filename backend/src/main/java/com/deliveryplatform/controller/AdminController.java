package com.deliveryplatform.controller;

import com.deliveryplatform.dto.response.*;
import com.deliveryplatform.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/system/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getGlobalStats());
    }

    @GetMapping("/finance-summary")
    public ResponseEntity<Map<String, Object>> getFinanceSummary() {
        return ResponseEntity.ok(adminService.getFinanceSummary());
    }

    @GetMapping("/system/wallets")
    public ResponseEntity<PagedResponse<?>> getWallets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllWallets(page, size));
    }

    @GetMapping("/wallets")
    public ResponseEntity<PagedResponse<?>> getAllWallets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllWallets(page, size));
    }

    @GetMapping("/system/wallets/{agencyId}")
    public ResponseEntity<Map<String, Object>> getAgencyWallet(@PathVariable UUID agencyId) {
        return ResponseEntity.ok(adminService.getAgencyWallet(agencyId));
    }

    @PutMapping("/system/pricing")
    public ResponseEntity<Void> setPricing(@RequestBody Map<String, Object> config) {
        adminService.setPricingConfig(config);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/system/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        return ResponseEntity.ok(adminService.getSystemHealth());
    }

    @GetMapping("/system/payouts")
    public ResponseEntity<PagedResponse<?>> getPayouts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminService.getAllPayoutRequests(page, size, status));
    }

    @PutMapping("/system/payouts/{id}/approve")
    public ResponseEntity<Void> approvePayout(@PathVariable UUID id) {
        adminService.approvePayout(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/system/payouts/{id}/reject")
    public ResponseEntity<Void> rejectPayout(@PathVariable UUID id, @RequestParam(required = false) String reason) {
        adminService.rejectPayout(id, reason);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/system/live-drivers")
    public ResponseEntity<List<?>> getLiveDrivers(@RequestParam(required = false) UUID agencyId) {
        return ResponseEntity.ok(adminService.getGlobalLiveDrivers(agencyId));
    }

    @GetMapping("/system/live-orders")
    public ResponseEntity<List<?>> getLiveOrders(@RequestParam(required = false) UUID agencyId) {
        return ResponseEntity.ok(adminService.getGlobalLiveOrders(agencyId));
    }

    @PostMapping("/agencies")
    public ResponseEntity<?> createAgency(@RequestBody com.deliveryplatform.dto.request.AgencyCreateRequest request) {
        log.info("POST /api/admin/agencies — Incoming create agency request");
        try {
            AgencyResponse response = adminService.createAgency(request);
            log.info("Agency created successfully: {}", response.getId());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Validation error during agency creation: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Error during agency creation: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/agencies/{id}")
    public ResponseEntity<AgencyResponse> updateAgency(
            @PathVariable UUID id,
            @RequestBody com.deliveryplatform.dto.request.AgencyUpdateRequest request) {
        log.info("PUT /api/admin/agencies/{} — Incoming update agency request", id);
        return ResponseEntity.ok(adminService.updateAgency(id, request));
    }

    @GetMapping("/regions")
    public ResponseEntity<List<Map<String, Object>>> getRegionSummary() {
        return ResponseEntity.ok(adminService.getRegionSummary());
    }

    @GetMapping("/drivers/orphans")
    public ResponseEntity<List<Map<String, Object>>> getOrphanDrivers() {
        return ResponseEntity.ok(adminService.getOrphanDrivers());
    }

    @PatchMapping("/drivers/{driverId}/reassign-agency")
    public ResponseEntity<Void> reassignDriverToAgency(
            @PathVariable UUID driverId,
            @RequestBody Map<String, String> body) {
        UUID agencyId = UUID.fromString(body.get("agencyId"));
        adminService.reassignDriverToAgency(driverId, agencyId);
        return ResponseEntity.ok().build();
    }
}

