package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "agency_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgencyTransaction {
    
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_wallet_id", nullable = false)
    private AgencyWallet agencyWallet;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status;

    private String description;

    @Column(name = "order_id")
    private UUID orderId;

    @Column(name = "reference_id")
    private UUID referenceId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime date;
}
