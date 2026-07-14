package com.deliveryplatform.service.finance.impl;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.finance.LedgerEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LedgerEngineImpl implements LedgerEngine {

    private final LedgerAccountRepository accountRepository;
    private final JournalEntryRepository journalRepository;
    private final LedgerEntryRepository entryRepository;
    private final WalletRepository walletRepository;
    private final WalletTimelineRepository timelineRepository;

    @Override
    @Transactional
    public JournalEntry recordTransaction(
            String idempotencyKey,
            String description,
            String referenceType,
            String referenceId,
            UUID createdBy,
            Map<String, BigDecimal> debits,
            Map<String, BigDecimal> credits
    ) {
        // Validate idempotency
        if (idempotencyKey != null) {
            var existing = journalRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Duplicate transaction detected for idempotencyKey: {}", idempotencyKey);
                return existing.get();
            }
        }

        // Validate debits == credits
        BigDecimal totalDebit = debits.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = credits.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new IllegalArgumentException("Debit sum (" + totalDebit + ") must equal Credit sum (" + totalCredit + ")");
        }

        // Create Journal Entry
        JournalEntry journal = JournalEntry.builder()
                .idempotencyKey(idempotencyKey)
                .description(description)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .status("POSTED")
                .createdBy(createdBy)
                .postedAt(LocalDateTime.now())
                .build();
        journal = journalRepository.save(journal);

        // Record Ledger Entries and update projections
        for (String code : debits.keySet()) {
            BigDecimal amount = debits.get(code);
            if (amount.compareTo(BigDecimal.ZERO) > 0) {
                postLedgerEntry(journal, code, amount, BigDecimal.ZERO, referenceId);
            }
        }

        for (String code : credits.keySet()) {
            BigDecimal amount = credits.get(code);
            if (amount.compareTo(BigDecimal.ZERO) > 0) {
                postLedgerEntry(journal, code, BigDecimal.ZERO, amount, referenceId);
            }
        }

        return journal;
    }

    private void postLedgerEntry(JournalEntry journal, String code, BigDecimal debit, BigDecimal credit, String referenceId) {
        LedgerAccount account = accountRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Ledger account not found: " + code));

        // Get running balance
        BigDecimal balanceBefore = BigDecimal.ZERO;
        List<LedgerEntry> entries = entryRepository.findByLedgerAccountId(account.getId());
        if (!entries.isEmpty()) {
            balanceBefore = entries.get(entries.size() - 1).getBalanceAfter();
        }

        BigDecimal balanceAfter = balanceBefore;
        if ("ASSET".equals(account.getType()) || "EXPENSE".equals(account.getType())) {
            balanceAfter = balanceBefore.add(debit).subtract(credit);
        } else {
            balanceAfter = balanceBefore.add(credit).subtract(debit);
        }

        LedgerEntry entry = LedgerEntry.builder()
                .journalEntry(journal)
                .ledgerAccount(account)
                .debit(debit)
                .credit(credit)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .build();
        entryRepository.save(entry);

        // Update Wallet cache projection if applicable
        if (("CLIENT_WALLET_LIABILITY".equals(code) || "MERCHANT_PAYABLE".equals(code)) && referenceId != null) {
            try {
                UUID walletId = UUID.fromString(referenceId);
                walletRepository.findById(walletId).ifPresent(wallet -> {
                    BigDecimal change = credit.subtract(debit); // Liability increases with Credit, decreases with Debit
                    wallet.setBalance(wallet.getBalance().add(change));
                    walletRepository.save(wallet);

                    // Create Timeline event
                    WalletTimeline timeline = WalletTimeline.builder()
                            .walletId(wallet.getId())
                            .amount(change)
                            .eventType("BALANCE_ADJUSTMENT")
                            .description(journal.getDescription())
                            .reference(journal.getReferenceId())
                            .actor("SYSTEM")
                            .build();
                    timelineRepository.save(timeline);
                });
            } catch (Exception e) {
                log.warn("Failed to parse wallet UUID from referenceId for cache projection: {}", referenceId);
            }
        }
    }
}
