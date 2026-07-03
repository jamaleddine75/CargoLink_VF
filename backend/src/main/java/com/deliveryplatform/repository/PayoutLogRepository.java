package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.PayoutLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayoutLogRepository extends JpaRepository<PayoutLog, UUID> {
    Optional<PayoutLog> findByPaypalBatchId(String paypalBatchId);
    Optional<PayoutLog> findByWithdrawalId(UUID withdrawalId);
}
