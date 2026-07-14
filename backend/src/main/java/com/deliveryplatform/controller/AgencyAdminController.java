package com.deliveryplatform.controller;

import com.deliveryplatform.dto.request.CreateOrderRequest;
import com.deliveryplatform.dto.response.DriverResponse;
import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.dto.response.PagedResponse;
import com.deliveryplatform.security.UserPrincipal;
import com.deliveryplatform.service.AgencyService;
import com.deliveryplatform.service.DriverService;
import com.deliveryplatform.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import com.deliveryplatform.dto.response.DriverDisciplinaryHistoryResponse;
import com.deliveryplatform.dto.request.DisciplinaryActionRequest;
import com.deliveryplatform.dto.response.UserResponse;

@RestController
@RequestMapping("/api/agency")
@RequiredArgsConstructor
public class AgencyAdminController {

    private final AgencyService agencyService;
    private final DriverService driverService;
    private final OrderService orderService;

    @GetMapping("/orders")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<PagedResponse<OrderResponse>> getAgencyOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        
        // If city filter is provided, use the city-specific query
        if (city != null && !city.isBlank()) {
            return ResponseEntity.ok(agencyService.getOrdersByCity(agencyId, city, type, status, page, size, principal.getId(), role));
        }
        
        // Otherwise use the standard agency orders query
        return ResponseEntity.ok(agencyService.getAgencyOrders(agencyId, status, page, size, principal.getId(), role));
    }

    @PostMapping("/orders")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<OrderResponse> createOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateOrderRequest request) {
        if (principal == null || principal.getId() == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(orderService.createOrder(request, principal.getId()));
    }

    @GetMapping("/orders/{id}")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<OrderResponse> getOrderById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        
        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(agencyService.getOrderById(id, agencyId, principal.getId(), role));
    }

    @PutMapping("/orders/{id}/validate")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<Void> validateDelivery(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        
        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        agencyService.validateDelivery(UUID.fromString(id), agencyId, principal.getId(), role);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/drivers")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<List<DriverResponse>> getAgencyDrivers(
            @AuthenticationPrincipal UserPrincipal principal) {

        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(agencyService.getAgencyDrivers(agencyId, principal.getId(), role));
    }

    @GetMapping("/drivers/{id}")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<DriverResponse> getAgencyDriver(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {

        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        DriverResponse driver = driverService.getDriverById(id, principal.getId(), role, agencyId);
        if (!agencyId.equals(driver.getAgencyId())) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(driver);
    }

    @PutMapping("/orders/{id}/confirm-payment")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> confirmPayment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        
        String role = principal.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(agencyService.confirmCashPayment(UUID.fromString(id), principal.getId(), role));
    }

    @GetMapping("/settings")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<com.deliveryplatform.dto.response.AgencyResponse> getAgencySettings(
            @AuthenticationPrincipal UserPrincipal principal) {
        
        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(agencyService.getAgencyById(agencyId, principal.getId(), role));
    }

    @PutMapping("/settings")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<Void> updateAgencySettings(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody com.deliveryplatform.dto.request.AgencySettingsRequest request) {
        
        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        agencyService.updateAgencySettings(agencyId, request, principal.getId(), role);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/drivers/{id}/extend-permission")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<DriverResponse> extendWorkPermission(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {

        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(agencyService.extendWorkPermission(id, agencyId, principal.getId(), role));
    }

    @PutMapping("/drivers/{id}/suspend")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<Void> suspendDriver(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody DisciplinaryActionRequest request) {
        
        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        agencyService.suspendDriver(id, agencyId, request.getReason(), principal.getId(), role);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/drivers/{id}/reactivate")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<Void> reactivateDriver(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody DisciplinaryActionRequest request) {
        
        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        agencyService.reactivateDriver(id, agencyId, request.getReason(), principal.getId(), role);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/drivers/{id}/blacklist")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<Void> blacklistDriver(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody DisciplinaryActionRequest request) {
        
        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        agencyService.blacklistDriver(id, agencyId, request.getReason(), principal.getId(), role);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/drivers/{id}/history")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<List<DriverDisciplinaryHistoryResponse>> getDriverHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        
        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(agencyService.getDriverDisciplinaryHistory(id, agencyId, principal.getId(), role));
    }

    @GetMapping("/pending-drivers")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<List<UserResponse>> getPendingDrivers(
            @AuthenticationPrincipal UserPrincipal principal) {

        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(agencyService.getPendingDrivers(agencyId, principal.getId(), role));
    }

    @PutMapping("/approve-driver/{id}")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<Void> approveDriver(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {

        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        agencyService.approveDriver(id, agencyId, principal.getId(), role);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/reject-driver/{id}")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<Void> rejectDriver(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) String reason) {

        UUID agencyId = principal.getRequiredAgencyId();
        String role = principal.getAuthorities().iterator().next().getAuthority();
        agencyService.rejectDriver(id, agencyId, reason, principal.getId(), role);
        return ResponseEntity.ok().build();
    }
}
