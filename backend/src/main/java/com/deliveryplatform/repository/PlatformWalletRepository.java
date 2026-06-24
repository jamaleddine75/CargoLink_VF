package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.PlatformWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlatformWalletRepository extends JpaRepository<PlatformWallet, UUID> {
    @Query("SELECT p FROM PlatformWallet p")
    Optional<PlatformWallet> findGlobalWallet();
}
