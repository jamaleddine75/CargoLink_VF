package com.deliveryplatform.service.billing.impl;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.domain.entity.AgencyWallet;
import com.deliveryplatform.domain.entity.billing.AgencyLedgerTransaction;
import com.deliveryplatform.domain.entity.billing.LedgerTransactionType;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.repository.AgencyRepository;
import com.deliveryplatform.repository.AgencyWalletRepository;
import com.deliveryplatform.repository.billing.AgencyLedgerTransactionRepository;
import com.deliveryplatform.service.billing.LedgerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LedgerServiceImpl implements LedgerService {

    private final AgencyLedgerTransactionRepository ledgerRepository;
    private final AgencyWalletRepository walletRepository;
    private final AgencyRepository agencyRepository;

    @Override
    @Transactional
    public void recordTransaction(UUID agencyId, LedgerTransactionType type, String referenceType, UUID referenceId, String description, BigDecimal debit, BigDecimal credit) {
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", agencyId));

        AgencyWallet wallet = walletRepository.findByAgencyId(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("AgencyWallet", "agencyId", agencyId));

        // Update Wallet Balance
        // Credit increases balance (Revenue/Income), Debit decreases balance (Expense/Payout)
        BigDecimal oldBalance = wallet.getCurrentBalance();
        BigDecimal newBalance = oldBalance.add(credit).subtract(debit);
        
        wallet.setCurrentBalance(newBalance);
        
        // Update Revenue/Expenses
        if (credit.compareTo(BigDecimal.ZERO) > 0) {
            wallet.setTotalRevenue(wallet.getTotalRevenue().add(credit));
        }
        if (debit.compareTo(BigDecimal.ZERO) > 0) {
            wallet.setTotalExpenses(wallet.getTotalExpenses().add(debit));
        }
        
        // Update Profit
        wallet.setTotalProfit(wallet.getTotalRevenue().subtract(wallet.getTotalExpenses()));
        
        walletRepository.save(wallet);

        // Record Ledger Transaction
        AgencyLedgerTransaction transaction = AgencyLedgerTransaction.builder()
                .agency(agency)
                .transactionType(type)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .description(description)
                .debit(debit)
                .credit(credit)
                .balanceAfter(newBalance)
                .build();

        ledgerRepository.save(transaction);
        
        log.info("Recorded ledger transaction for agency {}: {} | Balance: {}", agencyId, type, newBalance);
    }
}
