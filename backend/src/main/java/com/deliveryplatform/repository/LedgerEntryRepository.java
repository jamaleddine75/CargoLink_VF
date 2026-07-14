package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {
    List<LedgerEntry> findByJournalEntryId(UUID journalEntryId);
    List<LedgerEntry> findByLedgerAccountId(UUID ledgerAccountId);
}
