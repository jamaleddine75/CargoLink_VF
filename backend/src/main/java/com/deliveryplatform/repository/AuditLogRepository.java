package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);
    Page<AuditLog> findByActionContainingIgnoreCase(String action, Pageable pageable);
    Page<AuditLog> findByActorEmailContainingIgnoreCase(String email, Pageable pageable);
}
