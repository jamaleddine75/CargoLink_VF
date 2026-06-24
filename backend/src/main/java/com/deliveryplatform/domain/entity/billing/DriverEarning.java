package com.deliveryplatform.domain.entity.billing;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.domain.entity.Driver;
import com.deliveryplatform.domain.entity.Order;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "driver_earnings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE driver_earnings SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class DriverEarning {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(name = "base_amount", nullable = false)
    @Builder.Default
    private BigDecimal baseAmount = BigDecimal.ZERO;

    @Column(name = "commission_amount", nullable = false)
    @Builder.Default
    private BigDecimal commissionAmount = BigDecimal.ZERO;

    @Column(name = "bonus_amount", nullable = false)
    @Builder.Default
    private BigDecimal bonusAmount = BigDecimal.ZERO;

    @Column(name = "penalty_amount", nullable = false)
    @Builder.Default
    private BigDecimal penaltyAmount = BigDecimal.ZERO;

    @Column(name = "net_amount", nullable = false)
    @Builder.Default
    private BigDecimal netAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DriverEarningStatus status = DriverEarningStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder.Default
    private boolean deleted = false;
}
