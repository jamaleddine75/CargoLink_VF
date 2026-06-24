package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.AgencyWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgencyWalletRepository extends JpaRepository<AgencyWallet, UUID> {
    Optional<AgencyWallet> findByAgencyId(UUID agencyId);
}
