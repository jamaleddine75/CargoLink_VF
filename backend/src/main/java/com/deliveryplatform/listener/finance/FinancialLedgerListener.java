package com.deliveryplatform.listener.finance;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.event.finance.FinancialMutationEvent;
import com.deliveryplatform.repository.AgencyTransactionRepository;
import com.deliveryplatform.repository.PlatformTransactionRepository;
import com.deliveryplatform.repository.TransactionRepository;
import com.deliveryplatform.repository.AgencyWalletRepository;
import com.deliveryplatform.repository.PlatformWalletRepository;
import com.deliveryplatform.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class FinancialLedgerListener {

    private final TransactionRepository transactionRepository;
    private final AgencyTransactionRepository agencyTransactionRepository;
    private final PlatformTransactionRepository platformTransactionRepository;
    private final WalletRepository walletRepository;
    private final AgencyWalletRepository agencyWalletRepository;
    private final PlatformWalletRepository platformWalletRepository;

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handleFinancialMutation(FinancialMutationEvent event) {
        log.debug("Processing Ledger Entry for Event: {} | EntityType: {} | EntityId: {}", 
                event.getEventId(), event.getEntityType(), event.getEntityId());

        switch (event.getEntityType()) {
            case USER:
                Wallet wallet = walletRepository.findById(event.getEntityId())
                        .orElseThrow(() -> new IllegalArgumentException("User Wallet not found"));
                Transaction tx = Transaction.builder()
                        .wallet(wallet)
                        .type(event.getTransactionType())
                        .amount(event.getAmount())
                        .description(event.getReason())
                        .status(TransactionStatus.COMPLETED)
                        .orderId(event.getReferenceId())
                        .build();
                transactionRepository.save(tx);
                break;

            case AGENCY:
                AgencyWallet agencyWallet = agencyWalletRepository.findById(event.getEntityId())
                        .orElseThrow(() -> new IllegalArgumentException("Agency Wallet not found"));
                AgencyTransaction agencyTx = AgencyTransaction.builder()
                        .agencyWallet(agencyWallet)
                        .type(event.getTransactionType())
                        .amount(event.getAmount())
                        .description(event.getReason())
                        .status(TransactionStatus.COMPLETED)
                        .orderId(event.getReferenceId())
                        .build();
                agencyTransactionRepository.save(agencyTx);
                break;

            case PLATFORM:
                PlatformWallet platformWallet = platformWalletRepository.findById(event.getEntityId())
                        .orElseThrow(() -> new IllegalArgumentException("Platform Wallet not found"));
                PlatformTransaction platformTx = PlatformTransaction.builder()
                        .platformWallet(platformWallet)
                        .type(event.getTransactionType())
                        .amount(event.getAmount())
                        .description(event.getReason())
                        .status(TransactionStatus.COMPLETED)
                        .orderId(event.getReferenceId())
                        .build();
                platformTransactionRepository.save(platformTx);
                break;
        }
    }
}
