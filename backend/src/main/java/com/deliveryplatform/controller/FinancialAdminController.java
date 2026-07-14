package com.deliveryplatform.controller;

import com.deliveryplatform.dto.request.FinanceSettingsUpdateRequest;
import com.deliveryplatform.dto.request.WalletAdjustmentRequest;
import com.deliveryplatform.dto.response.finance.AnalyticsDTO;
import com.deliveryplatform.dto.response.finance.FinancialSummaryDTO;
import com.deliveryplatform.dto.response.finance.FinanceSettingsDTO;
import com.deliveryplatform.service.FinancialQueryService;
import com.deliveryplatform.service.FinancialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/finance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class FinancialAdminController {

    private final FinancialQueryService financialQueryService;
    private final FinancialService financialService;
    private final com.deliveryplatform.service.finance.SettlementEngine settlementEngine;
    private final com.deliveryplatform.service.finance.ReconciliationService reconciliationService;
    private final com.deliveryplatform.service.finance.FraudDetectionService fraudDetectionService;
    private final com.deliveryplatform.repository.FraudAlertRepository fraudAlertRepository;
    private final com.deliveryplatform.repository.ReconciliationReportRepository reconciliationReportRepository;
    private final com.deliveryplatform.repository.LedgerAccountRepository ledgerAccountRepository;
    private final com.deliveryplatform.repository.JournalEntryRepository journalEntryRepository;

    @GetMapping("/overview/kpis")
    public ResponseEntity<FinancialSummaryDTO> getOverviewKPIs() {
        return ResponseEntity.ok(financialQueryService.getOverviewKPIs());
    }

    @GetMapping("/analytics/top")
    public ResponseEntity<AnalyticsDTO> getAnalyticsTopPerformers() {
        return ResponseEntity.ok(financialQueryService.getAnalyticsSummary());
    }

    @GetMapping("/settings")
    public ResponseEntity<FinanceSettingsDTO> getFinanceSettings() {
        return ResponseEntity.ok(financialService.getFinanceSettings());
    }

    @PutMapping("/settings")
    public ResponseEntity<FinanceSettingsDTO> updateFinanceSettings(
            @Valid @RequestBody FinanceSettingsUpdateRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        return ResponseEntity.ok(financialService.updateFinanceSettings(request, principal.getId()));
    }
    
    @GetMapping({"/wallets", "/wallets/overview"})
    public ResponseEntity<?> getAllWallets(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size,
                                           @RequestParam(required = false) String walletType,
                                           @RequestParam(required = false) String status,
                                           @RequestParam(required = false) String search) {
        return ResponseEntity.ok(financialService.getAllWallets(page, size, walletType, status, search));
    }
    
    @PutMapping("/wallets/{id}/freeze")
    public ResponseEntity<?> freezeWallet(@PathVariable String id,
                                          @RequestParam String reason,
                                          @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        financialService.freezeWallet(id, principal.getId(), reason);
        return ResponseEntity.ok(java.util.Map.of("message", "Wallet frozen successfully"));
    }
    
    @PutMapping("/wallets/{id}/unfreeze")
    public ResponseEntity<?> unfreezeWallet(@PathVariable String id,
                                            @RequestParam String reason,
                                            @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        financialService.unfreezeWallet(id, principal.getId(), reason);
        return ResponseEntity.ok(java.util.Map.of("message", "Wallet unfrozen successfully"));
    }
    
    @PostMapping("/wallets/{id}/adjust")
    public ResponseEntity<?> adjustWalletBalance(@PathVariable String id,
                                                 @Valid @RequestBody WalletAdjustmentRequest request,
                                                 @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        return ResponseEntity.ok(financialService.adjustWalletBalance(id, request, principal.getId()));
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

    @PostMapping("/settle")
    public ResponseEntity<?> runManualSettlement(
            @RequestParam(defaultValue = "MANUAL") String scheduleType,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        return ResponseEntity.ok(settlementEngine.runSettlement(scheduleType, principal.getId()));
    }

    @PostMapping("/reconcile")
    public ResponseEntity<?> runManualReconciliation() {
        return ResponseEntity.ok(reconciliationService.reconcileCOD());
    }

    @PostMapping("/fraud-scan")
    public ResponseEntity<?> runFraudScan() {
        fraudDetectionService.scanForFinancialFraud();
        return ResponseEntity.ok(java.util.Map.of("message", "Fraud risk scan completed"));
    }

    @GetMapping("/fraud-alerts")
    public ResponseEntity<?> getFraudAlerts() {
        return ResponseEntity.ok(fraudAlertRepository.findAll());
    }

    @GetMapping("/reconciliations")
    public ResponseEntity<?> getReconciliations() {
        return ResponseEntity.ok(reconciliationReportRepository.findAll());
    }

    @PutMapping("/withdrawals/{id}/approve")
    public ResponseEntity<?> approveWithdrawal(
            @PathVariable UUID id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        financialService.approveWithdrawal(id, principal.getId());
        return ResponseEntity.ok(java.util.Map.of("message", "Withdrawal approved successfully"));
    }

    @PutMapping("/withdrawals/{id}/reject")
    public ResponseEntity<?> rejectWithdrawal(
            @PathVariable UUID id,
            @RequestParam String reason,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.deliveryplatform.security.UserPrincipal principal) {
        financialService.rejectWithdrawal(id, principal.getId(), reason);
        return ResponseEntity.ok(java.util.Map.of("message", "Withdrawal rejected successfully"));
    }

    @PostMapping("/export")
    public ResponseEntity<?> exportData(
            @RequestParam String type,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String status) {
        java.util.List<?> data;
        switch (type) {
            case "transactions":
                data = financialService.getGlobalTransactions(0, 10000, null, status).getContent();
                break;
            case "withdrawals":
                data = financialService.getWithdrawalRequests(0, 10000, status).getContent();
                break;
            default:
                data = financialService.getGlobalTransactions(0, 10000, null, null).getContent();
        }
        String csv = toCSV(data, type);
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=" + type + "_export.csv")
                .body(csv);
    }

    @GetMapping("/ledger-accounts")
    public ResponseEntity<?> getLedgerAccounts() {
        return ResponseEntity.ok(ledgerAccountRepository.findAll());
    }

    @GetMapping("/journal-entries")
    public ResponseEntity<?> getJournalEntries() {
        return ResponseEntity.ok(journalEntryRepository.findAll());
    }

    private String toCSV(java.util.List<?> data, String type) {
        if (data.isEmpty()) return "No data";
        StringBuilder sb = new StringBuilder();
        Object first = data.get(0);
        java.lang.reflect.Field[] fields = first.getClass().getDeclaredFields();
        for (int i = 0; i < fields.length; i++) {
            sb.append(fields[i].getName());
            if (i < fields.length - 1) sb.append(",");
        }
        sb.append("\n");
        for (Object item : data) {
            for (int i = 0; i < fields.length; i++) {
                try {
                    fields[i].setAccessible(true);
                    Object val = fields[i].get(item);
                    sb.append(val != null ? val.toString().replace(",", " ") : "");
                } catch (Exception e) {
                    sb.append("");
                }
                if (i < fields.length - 1) sb.append(",");
            }
            sb.append("\n");
        }
        return sb.toString();
    }
}
