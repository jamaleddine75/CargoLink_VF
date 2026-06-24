package com.deliveryplatform.repository.billing;

import com.deliveryplatform.domain.entity.billing.AgencyLedgerTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgencyLedgerTransactionRepository extends JpaRepository<AgencyLedgerTransaction, UUID>, JpaSpecificationExecutor<AgencyLedgerTransaction> {
    
    @Query("SELECT t FROM AgencyLedgerTransaction t WHERE t.agency.id = :agencyId ORDER BY t.createdAt DESC")
    Optional<AgencyLedgerTransaction> findLatestByAgencyId(@Param("agencyId") UUID agencyId);

    Page<AgencyLedgerTransaction> findByAgencyIdOrderByCreatedAtDesc(UUID agencyId, Pageable pageable);
}
