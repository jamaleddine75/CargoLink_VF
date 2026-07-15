package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
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

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id", nullable = false, unique = true)
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Agency agency;

    @Column(name = "balance", nullable = false)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Transient
    public BigDecimal getCurrentBalance() {
        return balance;
    }

    public void setCurrentBalance(BigDecimal currentBalance) {
        this.balance = currentBalance;
    }

    @Column(name = "total_revenue", nullable = false)
    @Builder.Default
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Column(name = "total_expenses", nullable = false)
    @Builder.Default
    private BigDecimal totalExpenses = BigDecimal.ZERO;

    @Transient
    public BigDecimal getTotalProfit() {
        return (totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .subtract(totalExpenses != null ? totalExpenses : BigDecimal.ZERO);
    }

    public void setTotalProfit(BigDecimal totalProfit) {
    }

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

    @Column(name = "frozen_reason", length = 500)
    private String frozenReason;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Version
    @Builder.Default
    private Long version = 0L;

}
