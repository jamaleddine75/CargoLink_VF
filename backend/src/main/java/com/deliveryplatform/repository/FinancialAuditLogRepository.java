package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.FinancialAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FinancialAuditLogRepository extends JpaRepository<FinancialAuditLog, UUID> {
}
