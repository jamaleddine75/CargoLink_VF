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
    
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(w.amount), 0) FROM WithdrawalRequest w WHERE w.status = :status")
    java.math.BigDecimal sumAmountByStatus(@org.springframework.data.repository.query.Param("status") com.deliveryplatform.domain.entity.TransactionStatus status);
}
