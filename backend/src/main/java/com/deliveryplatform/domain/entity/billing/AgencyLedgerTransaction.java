package com.deliveryplatform.domain.entity.billing;

import com.deliveryplatform.domain.entity.Agency;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "agency_ledger_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgencyLedgerTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private LedgerTransactionType transactionType;

    @Column(name = "reference_type")
    private String referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal debit = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal credit = BigDecimal.ZERO;

    @Column(name = "balance_after", nullable = false)
    private BigDecimal balanceAfter;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
