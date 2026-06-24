package com.deliveryplatform.controller.billing;

import com.deliveryplatform.domain.entity.billing.*;
import com.deliveryplatform.dto.billing.*;
import com.deliveryplatform.dto.response.PagedResponse;
import com.deliveryplatform.security.UserPrincipal;
import com.deliveryplatform.service.billing.AgencyBillingService;
import com.deliveryplatform.service.billing.InvoicingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/agencies/{agencyId}/billing")
@RequiredArgsConstructor
public class AgencyBillingController {

    private final AgencyBillingService billingService;
    private final InvoicingService invoicingService;

    // Security Utility: Validate that the agencyId in path matches the user's agencyId (unless SUPER_ADMIN)
    private void validateAgency(UserPrincipal principal, UUID agencyId) {
        if (!principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"))) {
            if (!agencyId.equals(principal.getRequiredAgencyId())) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied for agency: " + agencyId);
            }
        }
    }

    // Summary & Wallet
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<BillingSummaryResponse> getSummary(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(billingService.getBillingSummary(agencyId));
    }

    @GetMapping("/wallet")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<com.deliveryplatform.domain.entity.AgencyWallet> getWallet(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(billingService.getWallet(agencyId));
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Page<AgencyCustomerInvoice>> getInvoices(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(invoicingService.getInvoices(agencyId, PageRequest.of(page, size)));
    }

    @PostMapping("/invoices")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<AgencyCustomerInvoice> createInvoice(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @RequestBody InvoiceRequest request) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(invoicingService.createInvoice(agencyId, request));
    }

    @GetMapping("/invoices/{invoiceId}")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<AgencyCustomerInvoice> getInvoice(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @PathVariable UUID invoiceId) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(invoicingService.getInvoice(agencyId, invoiceId));
    }

    @PostMapping("/invoices/{invoiceId}/send")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<AgencyCustomerInvoice> sendInvoice(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @PathVariable UUID invoiceId) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(invoicingService.sendInvoice(agencyId, invoiceId));
    }

    @PostMapping("/invoices/{invoiceId}/pay")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<AgencyCustomerPayment> payInvoice(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @PathVariable UUID invoiceId,
            @RequestBody PaymentRequest request) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(billingService.recordCustomerPayment(agencyId, invoiceId, request));
    }

    @GetMapping("/invoices/{invoiceId}/download")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> downloadInvoice(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @PathVariable UUID invoiceId) {
        validateAgency(principal, agencyId);
        byte[] pdf = invoicingService.generateInvoicePdf(agencyId, invoiceId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "invoice-" + invoiceId + ".pdf");
        
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    @GetMapping("/payments")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Page<AgencyCustomerPayment>> getPayments(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(billingService.getPayments(agencyId, PageRequest.of(page, size)));
    }

    @GetMapping("/drivers/earnings")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Page<DriverEarning>> getDriverEarnings(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(billingService.getDriverEarnings(agencyId, PageRequest.of(page, size)));
    }

    @PostMapping("/drivers/earnings")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<DriverEarning> createEarning(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @RequestBody DriverEarningRequest request) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(billingService.createDriverEarning(
                agencyId, request.getDriverId(), request.getOrderId(),
                request.getBaseAmount(), request.getCommissionAmount(),
                request.getBonusAmount(), request.getPenaltyAmount()));
    }

    @PostMapping("/drivers/earnings/{earningId}/pay")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> payDriver(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @PathVariable UUID earningId) {
        validateAgency(principal, agencyId);
        billingService.payDriverEarning(agencyId, earningId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/ledger")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Page<AgencyLedgerTransaction>> getLedger(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(billingService.getLedger(agencyId, PageRequest.of(page, size)));
    }

    @PostMapping("/ledger/adjustment")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> recordAdjustment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @RequestParam java.math.BigDecimal amount,
            @RequestParam String description,
            @RequestParam boolean isCredit) {
        validateAgency(principal, agencyId);
        billingService.recordAdjustment(agencyId, amount, description, isCredit);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/cod/reconcile")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<CODReconciliation> reconcileCOD(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @RequestBody CODReconciliationRequest request) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(billingService.reconcileCOD(
                agencyId, 
                request.getOrderId(), 
                request.getDriverId(), 
                request.getExpectedAmount(), 
                request.getReceivedAmount(), 
                request.getNotes()
        ));
    }

    @GetMapping("/cod/reconciliations")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Page<CODReconciliation>> getCODReconciliations(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(billingService.getCODReconciliations(agencyId, PageRequest.of(page, size)));
    }

    @GetMapping("/cod/reconciliations/{id}")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<CODReconciliation> getCODReconciliation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @PathVariable UUID id) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(billingService.getCODReconciliation(agencyId, id));
    }

    @GetMapping("/platform-commissions")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Page<PlatformCommissionRecord>> getPlatformCommissions(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(billingService.getPlatformCommissions(agencyId, PageRequest.of(page, size)));
    }

    @PostMapping("/platform-commissions/calculate")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PlatformCommissionRecord> calculateCommission(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID agencyId,
            @RequestParam UUID orderId,
            @RequestParam java.math.BigDecimal grossAmount) {
        validateAgency(principal, agencyId);
        return ResponseEntity.ok(billingService.calculatePlatformCommission(agencyId, orderId, grossAmount));
    }
}
