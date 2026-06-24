package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "agency_wallets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgencyWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "agency_id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Agency agency;

    @Column(name = "balance", nullable = false)
    @Builder.Default
    private java.math.BigDecimal balance = java.math.BigDecimal.ZERO;

    @Column(name = "current_balance", nullable = false)
    @Builder.Default
    private java.math.BigDecimal currentBalance = java.math.BigDecimal.ZERO;

    @Column(name = "total_revenue", nullable = false)
    @Builder.Default
    private java.math.BigDecimal totalRevenue = java.math.BigDecimal.ZERO;

    @Column(name = "total_expenses", nullable = false)
    @Builder.Default
    private java.math.BigDecimal totalExpenses = java.math.BigDecimal.ZERO;

    @Column(name = "total_profit", nullable = false)
    @Builder.Default
    private java.math.BigDecimal totalProfit = java.math.BigDecimal.ZERO;

    @Column(name = "pending_receivables", nullable = false)
    @Builder.Default
    private java.math.BigDecimal pendingReceivables = java.math.BigDecimal.ZERO;

    @Column(name = "pending_payables", nullable = false)
    @Builder.Default
    private java.math.BigDecimal pendingPayables = java.math.BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private java.math.BigDecimal totalCommissionEarned = java.math.BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private java.math.BigDecimal pendingCommission = java.math.BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private java.math.BigDecimal commissionRate = java.math.BigDecimal.valueOf(0.15); // 15% default commission rate

    @Column(nullable = false)
    @Builder.Default
    private java.math.BigDecimal totalCollected = java.math.BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private java.math.BigDecimal totalPaidOut = java.math.BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private boolean isFrozen = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
