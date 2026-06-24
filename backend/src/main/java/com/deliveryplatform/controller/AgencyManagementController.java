package com.deliveryplatform.controller;

import com.deliveryplatform.dto.response.AgencyResponse;
import com.deliveryplatform.dto.response.AgencyMetricsResponse;
import com.deliveryplatform.dto.response.DriverResponse;
import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.dto.response.WalletResponse;
import com.deliveryplatform.dto.response.PagedResponse;
import com.deliveryplatform.service.AgencyManagementService;
import com.deliveryplatform.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/agencies")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AgencyManagementController {

    private final AgencyManagementService agencyService;
    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<List<AgencyResponse>> getAllAgencies() {
        return ResponseEntity.ok(agencyService.findAll());
    }

    @GetMapping("/paged")
    public ResponseEntity<PagedResponse<AgencyResponse>> getPagedAgencies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllAgencies(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AgencyResponse> getAgencyById(@PathVariable UUID id) {
        return ResponseEntity.ok(agencyService.findById(id));
    }

    @GetMapping("/{id}/metrics")
    public ResponseEntity<AgencyMetricsResponse> getAgencyMetrics(@PathVariable UUID id) {
        return ResponseEntity.ok(agencyService.getMetrics(id));
    }

    @GetMapping("/{id}/drivers")
    public ResponseEntity<List<DriverResponse>> getAgencyDrivers(@PathVariable UUID id) {
        return ResponseEntity.ok(agencyService.getDrivers(id));
    }

    @GetMapping("/{id}/orders")
    public ResponseEntity<List<OrderResponse>> getAgencyOrders(@PathVariable UUID id) {
        return ResponseEntity.ok(agencyService.getOrders(id));
    }

    @GetMapping("/{id}/wallet")
    public ResponseEntity<WalletResponse> getAgencyWallet(@PathVariable UUID id) {
        return ResponseEntity.ok(agencyService.getWallet(id));
    }

    @PatchMapping("/{id}/commission")
    public ResponseEntity<Void> updateCommission(@PathVariable UUID id, @RequestBody Map<String, java.math.BigDecimal> payload) {
        agencyService.updateCommission(id, payload.get("commission"));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable UUID id, @RequestBody String status) {
        agencyService.updateStatus(id, status);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/suspend")
    public ResponseEntity<Void> suspendAgency(@PathVariable UUID id, @RequestBody(required = false) Map<String, String> payload) {
        adminService.suspendAgency(id, payload != null ? payload.get("reason") : null);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateAgency(@PathVariable UUID id) {
        adminService.activateAgency(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetAdminPassword(@PathVariable UUID id) {
        agencyService.resetAdminPassword(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/hide")
    public ResponseEntity<Void> hideAgency(@PathVariable UUID id) {
        agencyService.hideAgency(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/city")
    public ResponseEntity<Void> updateCity(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        agencyService.updateCity(id, payload.get("city"));
        return ResponseEntity.ok().build();
    }
}
