package com.deliveryplatform.controller;

import com.deliveryplatform.domain.entity.PlatformWallet;
import com.deliveryplatform.dto.response.TransactionResponse;
import com.deliveryplatform.service.PayoutService;
import com.deliveryplatform.service.PlatformWalletService;
import com.deliveryplatform.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/financial")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class FinancialAdminController {

    private final PlatformWalletService platformWalletService;
    private final WalletService walletService;
    private final PayoutService payoutService;

    @GetMapping("/wallet")
    public ResponseEntity<PlatformWallet> getPlatformWallet() {
        return ResponseEntity.ok(platformWalletService.getGlobalWallet());
    }

    @GetMapping("/cod-remittances/pending")
    public ResponseEntity<List<TransactionResponse>> getPendingRemittances() {
        return ResponseEntity.ok(walletService.getPendingCODRemittances());
    }

    @GetMapping("/cod-remittances")
    public ResponseEntity<List<TransactionResponse>> getAllRemittances(
            @RequestParam(required = false, defaultValue = "ALL") String status) {
        return ResponseEntity.ok(walletService.getAllCODRemittances(status));
    }

    @PostMapping("/cod-remittances/{id}/reject")
    public ResponseEntity<Void> rejectRemittance(@PathVariable UUID id, @RequestParam String reason) {
        walletService.rejectCODRemittance(id, reason);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/cod-remittances/{id}/accept")
    public ResponseEntity<Void> acceptRemittance(@PathVariable UUID id) {
        walletService.acceptCODRemittance(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/payout/drivers/all")
    public ResponseEntity<Map<String, Object>> processAllDriverPayouts() {
        return ResponseEntity.ok(payoutService.processMonthlyDriverPayouts());
    }

    @PostMapping("/payout/agencies/all")
    public ResponseEntity<Map<String, Object>> processAllAgencyPayouts() {
        return ResponseEntity.ok(payoutService.processMonthlyAgencyPayouts());
    }

    @PostMapping("/payout/driver/{id}")
    public ResponseEntity<Map<String, Object>> payoutSingleDriver(@PathVariable UUID id) {
        return ResponseEntity.ok(payoutService.payoutSingleDriver(id));
    }

    @PostMapping("/payout/agency/{id}")
    public ResponseEntity<Map<String, Object>> payoutSingleAgency(@PathVariable UUID id) {
        return ResponseEntity.ok(payoutService.payoutSingleAgency(id));
    }
}
