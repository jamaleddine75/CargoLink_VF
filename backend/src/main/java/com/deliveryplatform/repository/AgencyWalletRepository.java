package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.AgencyWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgencyWalletRepository extends JpaRepository<AgencyWallet, UUID> {
    Optional<AgencyWallet> findByAgencyId(UUID agencyId);

    /** FIX CC-02: Use pessimistic write lock for concurrent agency payout requests. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT aw FROM AgencyWallet aw WHERE aw.agency.id = :agencyId")
    Optional<AgencyWallet> findByAgencyIdWithLock(@Param("agencyId") UUID agencyId);
}
