package com.deliveryplatform.domain.entity.billing;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.domain.entity.Order;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "platform_commission_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformCommissionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "gross_amount", nullable = false)
    private BigDecimal grossAmount;

    @Column(name = "platform_fee_rate", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal platformFeeRate = new BigDecimal("0.0500");

    @Column(name = "platform_fee_amount", nullable = false)
    private BigDecimal platformFeeAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PlatformCommissionStatus status = PlatformCommissionStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
