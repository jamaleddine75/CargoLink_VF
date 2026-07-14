package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "financial_operations",
        indexes = {
                @Index(name = "idx_fin_ops_type_status", columnList = "operation_type,status"),
                @Index(name = "idx_fin_ops_reference", columnList = "reference_type,reference_id"),
                @Index(name = "idx_fin_ops_created_at", columnList = "created_at")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_fin_ops_idempotency_key", columnNames = "idempotency_key")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "operation_type", nullable = false, length = 60)
    private FinancialOperationType operationType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private FinancialOperationStatus status = FinancialOperationStatus.REQUESTED;

    @Column(name = "idempotency_key", nullable = false, length = 255)
    private String idempotencyKey;

    @Column(name = "reference_type", length = 80)
    private String referenceType;

    @Column(name = "reference_id", length = 255)
    private String referenceId;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "MAD";

    @Column(precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @Version
    @Builder.Default
    private Long version = 0L;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
