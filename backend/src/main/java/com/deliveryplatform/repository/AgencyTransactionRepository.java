package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.AgencyTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AgencyTransactionRepository extends JpaRepository<AgencyTransaction, UUID> {
    java.util.List<AgencyTransaction> findByAgencyWalletIdAndType(UUID agencyWalletId, com.deliveryplatform.domain.entity.TransactionType type);
}
