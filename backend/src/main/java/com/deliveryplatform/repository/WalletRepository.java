package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.Wallet;
import com.deliveryplatform.domain.entity.WalletType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {
    @Query("SELECT w FROM Wallet w WHERE w.user.id = :userId")
    Optional<Wallet> findByUserId(@Param("userId") UUID userId);

    /** FIX BB-01: Pessimistic write lock — prevents concurrent payout race conditions. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.user.id = :userId")
    Optional<Wallet> findByUserIdWithLock(@Param("userId") UUID userId);

    Optional<Wallet> findByUserEmail(String email);

    @Query("SELECT w FROM Wallet w WHERE w.walletType = :walletType")
    List<Wallet> findByWalletType(@Param("walletType") WalletType walletType);

    @Query("SELECT COALESCE(SUM(w.balance), 0) FROM Wallet w")
    java.math.BigDecimal sumTotalBalance();

    @Query("SELECT w FROM Wallet w LEFT JOIN Transaction t ON t.wallet.id = w.id GROUP BY w.id HAVING w.balance != COALESCE(SUM(CASE WHEN t.type = 'GAIN' OR t.type = 'DEPOSIT' THEN t.amount WHEN t.type = 'PAYOUT' OR t.type = 'DEDUCTION' THEN -t.amount ELSE 0 END), 0)")
    List<Wallet> findWalletsWithLedgerDrift();
}