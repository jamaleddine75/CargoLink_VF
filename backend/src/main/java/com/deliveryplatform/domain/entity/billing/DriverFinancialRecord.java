package com.deliveryplatform.domain.entity.billing;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.domain.entity.Driver;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "driver_financial_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverFinancialRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false, unique = true)
    private Driver driver;

    @Column(name = "total_earnings", nullable = false)
    @Builder.Default
    private BigDecimal totalEarnings = BigDecimal.ZERO;

    @Column(name = "total_paid", nullable = false)
    @Builder.Default
    private BigDecimal totalPaid = BigDecimal.ZERO;

    @Column(name = "total_penalties", nullable = false)
    @Builder.Default
    private BigDecimal totalPenalties = BigDecimal.ZERO;

    @Column(name = "total_bonuses", nullable = false)
    @Builder.Default
    private BigDecimal totalBonuses = BigDecimal.ZERO;

    @Column(name = "outstanding_balance", nullable = false)
    @Builder.Default
    private BigDecimal outstandingBalance = BigDecimal.ZERO;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
