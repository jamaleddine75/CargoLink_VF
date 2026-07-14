package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.WithdrawalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, UUID> {
    List<WithdrawalRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<WithdrawalRequest> findByStatusOrderByCreatedAtDesc(com.deliveryplatform.domain.entity.TransactionStatus status);
    org.springframework.data.domain.Page<WithdrawalRequest> findByStatus(com.deliveryplatform.domain.entity.TransactionStatus status, org.springframework.data.domain.Pageable pageable);
    List<WithdrawalRequest> findByStatusInAndCreatedAtBefore(List<com.deliveryplatform.domain.entity.TransactionStatus> statuses, java.time.LocalDateTime createdAt);
    
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(w.amount), 0) FROM WithdrawalRequest w WHERE w.status = :status")
    java.math.BigDecimal sumAmountByStatus(@org.springframework.data.repository.query.Param("status") com.deliveryplatform.domain.entity.TransactionStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(w.amount), 0) FROM WithdrawalRequest w WHERE w.user.id = :userId AND w.status IN (:statuses)")
    java.math.BigDecimal sumAmountByUserIdAndStatusIn(@org.springframework.data.repository.query.Param("userId") UUID userId, @org.springframework.data.repository.query.Param("statuses") List<com.deliveryplatform.domain.entity.TransactionStatus> statuses);

    java.util.Optional<WithdrawalRequest> findByPaypalItemId(String paypalItemId);

    /** FIX PP-05: Check for any in-flight request for this user before allowing a new one. */
    boolean existsByUserIdAndStatusIn(UUID userId, List<com.deliveryplatform.domain.entity.TransactionStatus> statuses);
}
