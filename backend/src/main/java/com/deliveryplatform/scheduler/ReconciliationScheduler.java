package com.deliveryplatform.scheduler;

import com.deliveryplatform.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReconciliationScheduler {

    private final WalletService walletService;

    /**
     * Runs daily at midnight (00:00:00)
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void runDailyReconciliation() {
        log.info("Starting scheduled daily COD reconciliation...");
        try {
            walletService.reconcileDailyBatch();
            log.info("Scheduled daily COD reconciliation completed successfully.");
        } catch (Exception e) {
            log.error("Error during scheduled COD reconciliation: {}", e.getMessage(), e);
        }
    }
}
