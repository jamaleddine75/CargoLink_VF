package com.deliveryplatform.controller;

import com.deliveryplatform.dto.response.*;
import com.deliveryplatform.dto.request.WithdrawalRequestDTO;
import com.deliveryplatform.dto.request.CODRemittanceRequestDTO;
import com.deliveryplatform.dto.request.PayoutRequestDTO;
import com.deliveryplatform.service.WalletService;
import com.deliveryplatform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/wallets", "/api/wallet"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('DRIVER', 'ADMIN', 'CLIENT', 'AGENCY')")
@Slf4j
public class WalletController {
    private final WalletService walletService;

    @GetMapping("/balance")
    public ResponseEntity<WalletResponse> getBalance(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = requireUserId(principal, "wallet balance");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(walletService.getDriverBalance(userId));
    }

    @GetMapping("/transactions")
    public ResponseEntity<PagedResponse<TransactionResponse>> getTransactions(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false, defaultValue = "ALL") String period,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        try {
            UUID userId = requireUserId(principal, "wallet transactions");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            return ResponseEntity.ok(walletService.getTransactions(userId, page, size, type, period, startDate, endDate));
        } catch (Exception e) {
            log.error("DIAGNOSTIC ERROR in getTransactions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .header("X-Error-Message", e.getMessage())
                    .body(null); 
        }
    }

    @GetMapping("/pending-cod")
    public ResponseEntity<List<TransactionResponse>> getPendingCOD(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = requireUserId(principal, "pending COD");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(walletService.getPendingCOD(userId));
    }

    @PostMapping("/cod-remittance")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<Map<String, Object>> declareCODRemittance(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CODRemittanceRequestDTO request) {
        UUID userId = requireUserId(principal, "COD remittance");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(walletService.declareCODRemittance(userId, request.getOrderIds(), request.getTotalAmount()));
    }

    @PostMapping("/remit/scan")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Map<String, Object>> remitByScan(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {
        UUID driverId = requireUserId(principal, "remit by scan");
        String agencyIdStr = body.get("agencyId");
        if (agencyIdStr == null) return ResponseEntity.badRequest().body(Map.of("message", "Agency ID is required"));
        UUID agencyId = UUID.fromString(agencyIdStr);
        return ResponseEntity.ok(walletService.remitAllByAgencyScan(driverId, agencyId));
    }



    @GetMapping("/commission/weekly")
    public ResponseEntity<Map<String, Object>> getWeeklyCommission(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = requireUserId(principal, "weekly commission");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(walletService.getWeeklyCommission(userId));
    }

    @GetMapping("/earnings/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlyEarnings(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = requireUserId(principal, "monthly earnings");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(walletService.getMonthlyEarnings(userId));
    }

    @PostMapping("/payout")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<Map<String, Object>> requestPayout(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody PayoutRequestDTO request) {
        UUID userId = requireUserId(principal, "payout request");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(walletService.requestPayout(userId, request.getAmount(), request.getBankAccount()));
    }

    @GetMapping("/bonuses")
    public ResponseEntity<List<TransactionResponse>> getBonuses(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = requireUserId(principal, "bonuses");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(walletService.getBonuses(userId));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getWalletStats(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = requireUserId(principal, "wallet stats");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(walletService.getWalletStats(userId));
    }

    @GetMapping("/stats/customer")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<CustomerWalletResponse> getCustomerWalletStats(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            UUID userId = requireUserId(principal, "customer wallet stats");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            return ResponseEntity.ok(walletService.getCustomerWalletStats(userId));
        } catch (Exception e) {
            log.error("DIAGNOSTIC ERROR in getCustomerWalletStats: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .header("X-Error-Message", e.getMessage())
                    .body(null);
        }
    }

    // Phase 5: Driver Earnings Endpoints
    @GetMapping("/withdrawals")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<List<WithdrawalRequestResponse>> getWithdrawalRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = requireUserId(principal, "withdrawal requests");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(walletService.getWithdrawalRequests(userId));
    }

    @GetMapping("/daily-earnings")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<List<DailyEarningsResponse>> getDailyEarnings(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "7") Integer days) {
        UUID userId = requireUserId(principal, "daily earnings");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(walletService.getDailyEarningsBreakdown(userId, days));
    }

    @GetMapping("/statement/csv")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<String> downloadStatement(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = requireUserId(principal, "statement csv");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String csv = walletService.generateCSVStatement(userId);
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=\"statement.csv\"")
                .body(csv);
    }

    @PostMapping({"/withdrawal-request", "/withdraw"})
    @PreAuthorize("hasAnyRole('DRIVER', 'CLIENT')")
    public ResponseEntity<WithdrawalRequestResponse> requestWithdrawal(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody WithdrawalRequestDTO request) {
        UUID userId = requireUserId(principal, "withdrawal request");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(walletService.createWithdrawalRequest(
            userId, request.getAmount(), request.getBankAccount(), request.getAccountHolder()));
    }

    // ── SUPER ADMIN endpoints ──────────────────────────────────────────────

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllWallets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(walletService.getAllWallets(page, size));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getWalletByUserId(@PathVariable UUID userId) {
        return ResponseEntity.ok(walletService.getDriverBalance(userId));
    }

    @PutMapping("/{userId}/freeze")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> freezeWallet(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "true") boolean freeze) {
        if (freeze) {
            walletService.freezeAccount(userId);
        } else {
            walletService.unfreezeAccount(userId);
        }
        return ResponseEntity.ok(Map.of("message", freeze ? "Wallet frozen" : "Wallet unfrozen"));
    }

    @PostMapping("/confirm-cod/{transactionId}")
    @PreAuthorize("hasAnyRole('AGENCY', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> confirmCODRemittance(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID transactionId) {
        log.info("confirmCODRemittance - START - transactionId: {}", transactionId);
        UUID agencyId = principal.getRequiredAgencyId();
        return ResponseEntity.ok(walletService.confirmCODRemittance(agencyId, transactionId));
    }

    @PostMapping("/reconcile-batch")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> reconcileBatch() {
        log.info("reconcileBatch - START");
        walletService.reconcileDailyBatch();
        return ResponseEntity.ok(Map.of("message", "Batch reconciliation completed"));
    }

    // === ADMIN: Withdrawal Management ===
    @GetMapping("/withdrawal-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<WithdrawalRequestResponse>> getAllWithdrawalRequests(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(walletService.getAllWithdrawalRequests(status));
    }

    @PostMapping("/withdrawal-requests/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> approveWithdrawal(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        walletService.approveWithdrawalRequest(principal.getId(), id);
        return ResponseEntity.ok(Map.of("message", "Withdrawal approved"));
    }

    @PostMapping("/withdrawal-requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> rejectWithdrawal(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        walletService.rejectWithdrawalRequest(principal.getId(), id, body.getOrDefault("reason", "Rejected by Admin"));
        return ResponseEntity.ok(Map.of("message", "Withdrawal rejected"));
    }

    // === ADMIN -> AGENCY: Payout Management ===
    @GetMapping("/agency-payout-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<com.deliveryplatform.domain.entity.AgencyPayoutRequest>> getAllAgencyPayoutRequests(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(walletService.getAllAgencyPayoutRequests(status));
    }

    @PostMapping("/agency-payout-requests/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> approveAgencyPayout(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        walletService.adminApproveAgencyPayout(principal.getId(), id);
        return ResponseEntity.ok(Map.of("message", "Agency payout approved"));
    }

    @PostMapping("/agency-payout-requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> rejectAgencyPayout(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        walletService.rejectAgencyPayout(principal.getId(), id, body.getOrDefault("reason", "Rejected by Admin"));
        return ResponseEntity.ok(Map.of("message", "Agency payout rejected"));
    }

    @GetMapping("/admin/finance/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getFinanceSummary() {
        return ResponseEntity.ok(walletService.getFinanceSummary());
    }

    @GetMapping("/agency/balance")
    @PreAuthorize("hasRole('AGENCY')")
    public ResponseEntity<com.deliveryplatform.domain.entity.AgencyWallet> getAgencyBalance(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID agencyId = principal.getRequiredAgencyId();
        return ResponseEntity.ok(walletService.getAgencyWallet(agencyId));
    }

    @GetMapping("/agency/commissions")
    @PreAuthorize("hasRole('AGENCY')")
    public ResponseEntity<List<TransactionResponse>> getAgencyCommissions(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID agencyId = principal.getRequiredAgencyId();
        return ResponseEntity.ok(walletService.getAgencyCommissions(agencyId));
    }

    @PostMapping("/agency/payout-request")
    @PreAuthorize("hasRole('AGENCY')")
    public ResponseEntity<Map<String, Object>> agencyRequestPayout(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody PayoutRequestDTO request) {
        UUID agencyId = principal.getRequiredAgencyId();
        return ResponseEntity.ok(walletService.agencyRequestPayout(agencyId, request.getAmount(), request.getBankAccount()));
    }

    @GetMapping("/agency/remittances")
    @PreAuthorize("hasRole('AGENCY')")
    public ResponseEntity<List<TransactionResponse>> getAgencyRemittances(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID agencyId = principal.getRequiredAgencyId();
        return ResponseEntity.ok(walletService.getAgencyRemittances(agencyId));
    }

    // === DRIVER: Earnings ===
    @GetMapping("/earnings/summary")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Map<String, Object>> getEarningsSummary(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(walletService.getEarningsSummary(principal.getId()));
    }

    @GetMapping("/cod/pending")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<List<TransactionResponse>> getPendingCodTransactions(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(walletService.getPendingCOD(principal.getId()));
    }

    @GetMapping("/pending-cod-remittances")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<List<TransactionResponse>> getPendingCodRemittances(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = requireUserId(principal, "pending COD remittances");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(walletService.getDriverPendingCODRemittances(userId));
    }

    @GetMapping("/agency/payout-requests")
    @PreAuthorize("hasRole('AGENCY')")
    public ResponseEntity<List<com.deliveryplatform.domain.entity.AgencyPayoutRequest>> getAgencyPayoutRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID agencyId = principal.getRequiredAgencyId();
        return ResponseEntity.ok(walletService.getAllAgencyPayoutRequestsByAgency(agencyId));
    }

    private UUID requireUserId(UserPrincipal principal, String action) {
        if (principal == null || principal.getId() == null) {
            log.warn("{} requested without authenticated principal", action);
            return null;
        }
        return principal.getId();
    }
}

