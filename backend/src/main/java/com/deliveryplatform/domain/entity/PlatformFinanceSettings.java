package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "platform_finance_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformFinanceSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "platform_fee_rate", nullable = false, precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal platformFeeRate = new BigDecimal("0.0500");

    @Column(name = "default_agency_commission_rate", nullable = false, precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal defaultAgencyCommissionRate = new BigDecimal("0.1500");

    @Enumerated(EnumType.STRING)
    @Column(name = "client_settlement_formula", nullable = false, length = 40)
    @Builder.Default
    private ClientSettlementFormula clientSettlementFormula = ClientSettlementFormula.COD_MINUS_FEE;

    @Column(name = "auto_reconcile_daily_batch", nullable = false)
    @Builder.Default
    private boolean autoReconcileDailyBatch = true;

    @Column(name = "debt_alert_threshold", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal debtAlertThreshold = new BigDecimal("1000.00");

    @Column(name = "updated_by")
    private UUID updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
