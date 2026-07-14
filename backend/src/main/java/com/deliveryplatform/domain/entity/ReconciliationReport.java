package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reconciliation_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReconciliationReport {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "expected_cod", nullable = false, precision = 19, scale = 4)
    private BigDecimal expectedCod = BigDecimal.ZERO;

    @Column(name = "collected_cod", nullable = false, precision = 19, scale = 4)
    private BigDecimal collectedCod = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal difference = BigDecimal.ZERO;

    @Column(nullable = false, length = 50)
    private String status = "MATCHED"; // MATCHED, DISCREPANCY

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
