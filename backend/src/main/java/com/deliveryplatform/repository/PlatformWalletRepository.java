package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.PlatformWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlatformWalletRepository extends JpaRepository<PlatformWallet, UUID> {

    @Query("SELECT p FROM PlatformWallet p")
    Optional<PlatformWallet> findGlobalWallet();

    /**
     * Pessimistic write lock to prevent concurrent balance mutations on the single PlatformWallet row.
     * Use this whenever updating balance, totalRevenue, platformProfit, or any financial aggregate.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PlatformWallet p")
    Optional<PlatformWallet> findGlobalWalletWithLock();
}
