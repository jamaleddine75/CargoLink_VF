package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "financial_outbox",
        indexes = {
                @Index(name = "idx_fin_outbox_status_next", columnList = "status,next_attempt_at"),
                @Index(name = "idx_fin_outbox_aggregate", columnList = "aggregate_type,aggregate_id,aggregate_version"),
                @Index(name = "idx_fin_outbox_operation", columnList = "operation_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_fin_outbox_event_key", columnNames = "event_key")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialOutboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "event_key", nullable = false, length = 255)
    private String eventKey;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "event_version", nullable = false)
    @Builder.Default
    private Integer eventVersion = 1;

    @Column(name = "aggregate_type", nullable = false, length = 100)
    private String aggregateType;

    @Column(name = "aggregate_id", nullable = false, length = 255)
    private String aggregateId;

    @Column(name = "aggregate_version", nullable = false)
    @Builder.Default
    private Long aggregateVersion = 1L;

    @Column(name = "operation_id")
    private UUID operationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private FinancialOutboxStatus status = FinancialOutboxStatus.PENDING;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String payload;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private Integer attemptCount = 0;

    @Column(name = "next_attempt_at")
    private LocalDateTime nextAttemptAt;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
