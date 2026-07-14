package com.deliveryplatform.service.finance.impl;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.finance.WalletProjectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletProjectionServiceImpl implements WalletProjectionService {

    private final WalletRepository walletRepository;
    private final LedgerAccountRepository accountRepository;
    private final LedgerEntryRepository entryRepository;

    @Override
    @Transactional
    public void recalculateWalletProjection(UUID walletId) {
        log.info("Recalculating wallet balance projection for wallet: {}", walletId);
        
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found: " + walletId));

        BigDecimal totalCredit = BigDecimal.ZERO;
        BigDecimal totalDebit = BigDecimal.ZERO;

        for (String accountCode : List.of("CLIENT_WALLET_LIABILITY", "MERCHANT_PAYABLE")) {
            var ledgerAccount = accountRepository.findByCode(accountCode);
            if (ledgerAccount.isPresent()) {
                List<LedgerEntry> entries = entryRepository.findByLedgerAccountId(ledgerAccount.get().getId());
                
                BigDecimal cred = entries.stream()
                        .filter(e -> walletId.toString().equals(e.getJournalEntry().getReferenceId()))
                        .map(LedgerEntry::getCredit)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                        
                BigDecimal deb = entries.stream()
                        .filter(e -> walletId.toString().equals(e.getJournalEntry().getReferenceId()))
                        .map(LedgerEntry::getDebit)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                totalCredit = totalCredit.add(cred);
                totalDebit = totalDebit.add(deb);
            }
        }

        BigDecimal finalBalance = totalCredit.subtract(totalDebit);
        wallet.setBalance(finalBalance);
        walletRepository.save(wallet);
        
        log.info("Wallet projection balance synced to: {}", finalBalance);
    }
}
