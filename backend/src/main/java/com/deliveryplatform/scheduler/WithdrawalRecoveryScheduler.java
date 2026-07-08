package com.deliveryplatform.scheduler;

import com.deliveryplatform.domain.entity.Transaction;
import com.deliveryplatform.domain.entity.Wallet;
import com.deliveryplatform.domain.entity.WithdrawalRequest;
import com.deliveryplatform.domain.entity.PayoutLog;
import com.deliveryplatform.domain.entity.TransactionStatus;
import com.deliveryplatform.domain.entity.TransactionType;
import com.deliveryplatform.repository.TransactionRepository;
import com.deliveryplatform.repository.WalletRepository;
import com.deliveryplatform.repository.WithdrawalRequestRepository;
import com.deliveryplatform.repository.PayoutLogRepository;
import com.deliveryplatform.service.PaymentProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class WithdrawalRecoveryScheduler {

    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final PayoutLogRepository payoutLogRepository;
    private final PaymentProvider paymentProvider;
    private final TransactionTemplate transactionTemplate;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    /**
     * Runs every minute to find stuck withdrawals and reconcile them with PayPal.
     */
    @Scheduled(fixedRate = 60000)
    public void recoverStuckWithdrawals() {
        log.debug("Starting withdrawal recovery job...");

        // Find stuck requests older than 2 minutes (to allow in-flight requests to finish)
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(2);
        List<WithdrawalRequest> stuckRequests = withdrawalRequestRepository.findByStatusInAndCreatedAtBefore(
                List.of(TransactionStatus.PENDING, TransactionStatus.PROCESSING), threshold);

        for (WithdrawalRequest wr : stuckRequests) {
            try {
                reconcileWithdrawal(wr);
            } catch (Exception e) {
                log.error("Failed to reconcile withdrawal " + wr.getId(), e);
            }
        }
    }

    private void reconcileWithdrawal(WithdrawalRequest wr) {
        PayoutLog logRecord = payoutLogRepository.findByWithdrawalId(wr.getId()).orElse(null);
        
        if (logRecord == null || logRecord.getPaypalBatchId() == null) {
            // PayPal was never called or batch ID was never returned. Safe to refund.
            log.warn("Withdrawal {} has no PayPal batch ID. Refunding.", wr.getId());
            refundWithdrawal(wr, "Recovery: No PayPal batch found");
            return;
        }

        PayoutLog updatedStatus = paymentProvider.getPayoutStatus(logRecord.getPaypalBatchId());
        
        if (updatedStatus == null) {
            log.warn("Unable to fetch status from PayPal for batch {}", logRecord.getPaypalBatchId());
            return;
        }

        String status = updatedStatus.getStatus(); // SUCCESS, PENDING, FAILED, DENIED, etc.
        
        if ("SUCCESS".equalsIgnoreCase(status)) {
            markAsSuccess(wr);
        } else if ("FAILED".equalsIgnoreCase(status) || "DENIED".equalsIgnoreCase(status) || "RETURNED".equalsIgnoreCase(status) || "CANCELED".equalsIgnoreCase(status)) {
            refundWithdrawal(wr, "Recovery: PayPal status " + status);
        } else {
            // Still PENDING at PayPal
            log.debug("Withdrawal {} still pending at PayPal.", wr.getId());
        }
    }

    private void markAsSuccess(WithdrawalRequest wr) {
        transactionTemplate.executeWithoutResult(status -> {
            WithdrawalRequest entity = withdrawalRequestRepository.findById(wr.getId()).orElseThrow();
            if (entity.getStatus() == TransactionStatus.COMPLETED) return;

            entity.setStatus(TransactionStatus.COMPLETED);
            entity.setCompletedAt(LocalDateTime.now());
            withdrawalRequestRepository.save(entity);

            transactionRepository.findByWalletUserIdAndTypeAndStatus(entity.getUser().getId(), TransactionType.PAYOUT, TransactionStatus.PROCESSING)
                    .stream()
                    .filter(tx -> tx.getAmount().negate().compareTo(entity.getAmount()) == 0)
                    .findFirst()
                    .ifPresent(tx -> {
                        tx.setStatus(TransactionStatus.COMPLETED);
                        transactionRepository.save(tx);
                    });
        });
    }

    private void refundWithdrawal(WithdrawalRequest wr, String reason) {
        transactionTemplate.executeWithoutResult(status -> {
            WithdrawalRequest entity = withdrawalRequestRepository.findById(wr.getId()).orElseThrow();
            if (entity.getStatus() == TransactionStatus.FAILED || entity.getStatus() == TransactionStatus.COMPLETED) return;

            entity.setStatus(TransactionStatus.FAILED);
            entity.setRejectionReason(reason);
            withdrawalRequestRepository.save(entity);

            Wallet wallet = walletRepository.findByUserIdWithLock(entity.getUser().getId()).orElseThrow();
            wallet.setBalance(wallet.getBalance().add(entity.getAmount()));
            walletRepository.save(wallet);

            Transaction refund = Transaction.builder()
                    .wallet(wallet)
                    .type(TransactionType.REFUND)
                    .description(reason)
                    .amount(entity.getAmount())
                    .date(LocalDateTime.now())
                    .status(TransactionStatus.COMPLETED)
                    .build();
            transactionRepository.save(refund);

            transactionRepository.findByWalletUserIdAndTypeAndStatus(entity.getUser().getId(), TransactionType.PAYOUT, TransactionStatus.PENDING)
                    .stream()
                    .filter(tx -> tx.getAmount().negate().compareTo(entity.getAmount()) == 0)
                    .findFirst()
                    .ifPresent(tx -> {
                        tx.setStatus(TransactionStatus.FAILED);
                        tx.setDescription(reason);
                        transactionRepository.save(tx);
                    });
        });
    }
}
