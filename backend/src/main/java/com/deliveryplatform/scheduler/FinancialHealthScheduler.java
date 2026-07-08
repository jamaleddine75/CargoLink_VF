package com.deliveryplatform.scheduler;

import com.deliveryplatform.repository.TransactionRepository;
import com.deliveryplatform.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class FinancialHealthScheduler {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    @Scheduled(fixedRate = 3600000) // Run every 1 hour
    public void checkFinancialHealth() {
        log.info("Running system-wide Financial Health Check...");
        
        // Find driver wallets where Stored Balance != Ledger Calculated Balance
        // This query alerts without auto-repairing.
        var driftedWallets = walletRepository.findWalletsWithLedgerDrift();
        
        if (!driftedWallets.isEmpty()) {
            log.error("CRITICAL ALARM: Detected {} wallets with mathematical drift!", driftedWallets.size());
            for (var w : driftedWallets) {
                log.error("Drifted Wallet ID: {}", w.getId());
                // Alert super admin via email or PagerDuty
            }
        } else {
            log.info("Financial Health Check passed: 0 drifted wallets.");
        }
    }
}
