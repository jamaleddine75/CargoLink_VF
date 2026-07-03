package com.deliveryplatform.controller;

import com.deliveryplatform.dto.response.*;
import com.deliveryplatform.service.AgencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agencies")
@RequiredArgsConstructor
public class AgencyController {

    private final AgencyService agencyService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<List<AgencyResponse>> getAllAgencies() {
        return ResponseEntity.ok(agencyService.getAllAgencies());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<AgencyResponse> getAgencyById(@PathVariable UUID id, @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        return ResponseEntity.ok(agencyService.getAgencyById(id, principal.getId(), principal.getAuthorities().iterator().next().getAuthority()));
    }

    @GetMapping("/{id}/metrics")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<AgencyMetricsResponse> getAgencyMetrics(@PathVariable UUID id, @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        return ResponseEntity.ok(agencyService.getAgencyMetrics(id, principal.getId(), principal.getAuthorities().iterator().next().getAuthority()));
    }

    @GetMapping("/{id}/drivers")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<List<DriverResponse>> getAgencyDrivers(@PathVariable UUID id, @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        return ResponseEntity.ok(agencyService.getAgencyDrivers(id, principal.getId(), principal.getAuthorities().iterator().next().getAuthority()));
    }

    @GetMapping("/{id}/orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<PagedResponse<OrderResponse>> getAgencyOrders(
            @PathVariable UUID id,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        return ResponseEntity.ok(agencyService.getAgencyOrders(id, status, page, size, principal.getId(), principal.getAuthorities().iterator().next().getAuthority()));
    }

    @PostMapping("/{id}/cod-remittance/{transactionId}/confirm")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> confirmCODRemittance(
            @PathVariable UUID id,
            @PathVariable UUID transactionId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        return ResponseEntity.ok(agencyService.confirmCODRemittance(transactionId, id, principal.getId(), principal.getAuthorities().iterator().next().getAuthority()));
    }

    @GetMapping("/{id}/pending-remittances")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<java.util.List<?>> getPendingRemittances(@PathVariable UUID id, @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        return ResponseEntity.ok(agencyService.getPendingRemittances(id, principal.getId(), principal.getAuthorities().iterator().next().getAuthority()));
    }

    @GetMapping("/{id}/wallet")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> getAgencyWallet(@PathVariable UUID id, @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        return ResponseEntity.ok(agencyService.getAgencyWalletBalance(id, principal.getId(), principal.getAuthorities().iterator().next().getAuthority()));
    }

    @GetMapping("/{id}/commissions")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<java.util.List<?>> getAgencyCommissions(@PathVariable UUID id, @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        return ResponseEntity.ok(agencyService.getCommissions(id, principal.getId(), principal.getAuthorities().iterator().next().getAuthority()));
    }

    @GetMapping("/{id}/payouts")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<java.util.List<?>> getAgencyPayouts(@PathVariable UUID id, @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        return ResponseEntity.ok(agencyService.getPayouts(id, principal.getId(), principal.getAuthorities().iterator().next().getAuthority()));
    }

    @PostMapping("/{id}/payouts/request")
    @PreAuthorize("hasAnyRole('AGENCY')")
    public ResponseEntity<Void> requestPayout(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, Object> payload,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        Object amountObj = payload.get("amount");
        java.math.BigDecimal amount = amountObj != null 
                ? new java.math.BigDecimal(amountObj.toString()) 
                : java.math.BigDecimal.ZERO;
        String paymentAccountIdStr = payload.get("paymentAccountId") != null ? payload.get("paymentAccountId").toString() : null;
        UUID paymentAccountId = paymentAccountIdStr != null && !paymentAccountIdStr.isEmpty() ? UUID.fromString(paymentAccountIdStr) : null;
        
        agencyService.requestPayout(id, amount, paymentAccountId, principal.getId(), principal.getAuthorities().iterator().next().getAuthority());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/commission-rate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> updateCommissionRate(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, Object> payload) {
        Object rateObj = payload.get("commissionRate");
        if (rateObj == null) {
             return ResponseEntity.badRequest().body(java.util.Map.of("error", "commissionRate is required"));
        }
        
        java.math.BigDecimal rate = new java.math.BigDecimal(rateObj.toString());
        if (rate.compareTo(java.math.BigDecimal.ZERO) < 0 || rate.compareTo(java.math.BigDecimal.ONE) > 0) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("error", "Rate must be between 0.0 and 1.0"));
        }
        agencyService.setCommissionRate(id, rate);
        return ResponseEntity.ok(java.util.Map.of("message", "Commission rate updated", "rate", rate));
    }
    @GetMapping("/{id}/cod-export")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<byte[]> exportCOD(
            @PathVariable UUID id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "csv") String format,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        
        byte[] data = agencyService.generateCODExport(id, status, startDate, endDate, format, principal.getId(), principal.getAuthorities().iterator().next().getAuthority());
        String filename = "cod_reconciliation_" + id + "." + format.toLowerCase();
        String contentType = "pdf".equalsIgnoreCase(format) ? "application/pdf" : "text/csv";

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                .body(data);
    }

    @PatchMapping("/{id}/hide")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> hideAgency(@PathVariable UUID id) {
        agencyService.hideAgency(id);
        return ResponseEntity.ok().build();
    }
}
