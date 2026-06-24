package com.deliveryplatform.controller;

import com.deliveryplatform.domain.entity.AgencyCustomerStatus;
import com.deliveryplatform.dto.request.AgencyCustomerRequest;
import com.deliveryplatform.dto.response.AgencyCustomerResponse;
import com.deliveryplatform.security.UserPrincipal;
import com.deliveryplatform.service.AgencyCustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/agencies/{agencyId}/customers")
@RequiredArgsConstructor
public class AgencyCustomerController {

    private final AgencyCustomerService customerService;

    private void validateAgencyAccess(UserPrincipal principal, UUID agencyId) {
        if (!principal.getRequiredAgencyId().equals(agencyId)) {
            throw new com.deliveryplatform.exception.UnauthorizedException("You do not have access to this agency's data.");
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<Page<AgencyCustomerResponse>> getCustomers(
            @PathVariable UUID agencyId,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        validateAgencyAccess(principal, agencyId);
        return ResponseEntity.ok(customerService.getCustomers(agencyId, query, pageable));
    }

    @GetMapping("/{customerId}")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<AgencyCustomerResponse> getCustomer(
            @PathVariable UUID agencyId,
            @PathVariable UUID customerId,
            @AuthenticationPrincipal UserPrincipal principal) {
        validateAgencyAccess(principal, agencyId);
        return ResponseEntity.ok(customerService.getCustomerDetails(agencyId, customerId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<AgencyCustomerResponse> createCustomer(
            @PathVariable UUID agencyId,
            @Valid @RequestBody AgencyCustomerRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        validateAgencyAccess(principal, agencyId);
        return ResponseEntity.ok(customerService.createCustomer(agencyId, request));
    }

    @PutMapping("/{customerId}")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<AgencyCustomerResponse> updateCustomer(
            @PathVariable UUID agencyId,
            @PathVariable UUID customerId,
            @Valid @RequestBody AgencyCustomerRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        validateAgencyAccess(principal, agencyId);
        return ResponseEntity.ok(customerService.updateCustomer(agencyId, customerId, request));
    }

    @PatchMapping("/{customerId}/suspend")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<Void> suspendCustomer(
            @PathVariable UUID agencyId,
            @PathVariable UUID customerId,
            @AuthenticationPrincipal UserPrincipal principal) {
        validateAgencyAccess(principal, agencyId);
        customerService.updateStatus(agencyId, customerId, AgencyCustomerStatus.SUSPENDED);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{customerId}/block")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<Void> blockCustomer(
            @PathVariable UUID agencyId,
            @PathVariable UUID customerId,
            @AuthenticationPrincipal UserPrincipal principal) {
        validateAgencyAccess(principal, agencyId);
        customerService.updateStatus(agencyId, customerId, AgencyCustomerStatus.BLOCKED);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{customerId}/activate")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<Void> activateCustomer(
            @PathVariable UUID agencyId,
            @PathVariable UUID customerId,
            @AuthenticationPrincipal UserPrincipal principal) {
        validateAgencyAccess(principal, agencyId);
        customerService.updateStatus(agencyId, customerId, AgencyCustomerStatus.ACTIVE);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{customerId}")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<Void> deleteCustomer(
            @PathVariable UUID agencyId,
            @PathVariable UUID customerId,
            @AuthenticationPrincipal UserPrincipal principal) {
        validateAgencyAccess(principal, agencyId);
        customerService.deleteCustomer(agencyId, customerId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/analytics/overview")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @PathVariable UUID agencyId,
            @AuthenticationPrincipal UserPrincipal principal) {
        validateAgencyAccess(principal, agencyId);
        return ResponseEntity.ok(customerService.getAnalytics(agencyId));
    }
}
