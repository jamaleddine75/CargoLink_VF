package com.deliveryplatform.controller;

import com.deliveryplatform.dto.response.finance.AnalyticsDTO;
import com.deliveryplatform.dto.response.finance.FinancialSummaryDTO;
import com.deliveryplatform.service.FinancialQueryService;
import com.deliveryplatform.service.FinancialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/finance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class FinancialAdminController {

    private final FinancialQueryService financialQueryService;
    private final FinancialService financialService;

    @GetMapping("/overview/kpis")
    public ResponseEntity<FinancialSummaryDTO> getOverviewKPIs() {
        return ResponseEntity.ok(financialQueryService.getOverviewKPIs());
    }

    @GetMapping("/analytics/top")
    public ResponseEntity<AnalyticsDTO> getAnalyticsTopPerformers() {
        return ResponseEntity.ok(financialQueryService.getAnalyticsSummary());
    }
    
    @GetMapping("/wallets")
    public ResponseEntity<?> getAllWallets(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(financialService.getAllWallets(page, size));
    }
    
    @PutMapping("/wallets/{id}/freeze")
    public ResponseEntity<?> freezeWallet(@PathVariable java.util.UUID id,
                                          @RequestParam String reason,
                                          @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        financialService.freezeWallet(id, principal.getId(), reason);
        return ResponseEntity.ok(java.util.Map.of("message", "Wallet frozen successfully"));
    }
    
    @PutMapping("/wallets/{id}/unfreeze")
    public ResponseEntity<?> unfreezeWallet(@PathVariable java.util.UUID id,
                                            @RequestParam String reason,
                                            @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        financialService.unfreezeWallet(id, principal.getId(), reason);
        return ResponseEntity.ok(java.util.Map.of("message", "Wallet unfrozen successfully"));
    }
    
    @PostMapping("/wallets/{id}/adjust")
    public ResponseEntity<?> adjustWalletBalance(@PathVariable java.util.UUID id,
                                                 @RequestParam java.math.BigDecimal amount,
                                                 @RequestParam String reason,
                                                 @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        return ResponseEntity.ok(financialService.adjustWalletBalance(id, amount, reason, principal.getId()));
    }
    
    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(@RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size,
                                             @RequestParam(required = false) String type,
                                             @RequestParam(required = false) String status) {
        return ResponseEntity.ok(financialService.getGlobalTransactions(page, size, type, status));
    }
    
    @GetMapping("/withdrawals")
    public ResponseEntity<?> getWithdrawals(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size,
                                            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(financialService.getWithdrawalRequests(page, size, status));
    }
}
