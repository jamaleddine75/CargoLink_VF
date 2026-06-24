package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "driver_shifts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverShift {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    private LocalDateTime endedAt;

    @Builder.Default
    private boolean isActive = true;

    @Builder.Default
    private Integer totalDeliveries = 0;

    @Builder.Default
    private Integer successfulDeliveries = 0;

    @Builder.Default
    private Integer failedDeliveries = 0;

    @Builder.Default
    private BigDecimal totalEarnings = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal totalCod = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal totalDistanceKm = BigDecimal.ZERO;

    @Builder.Default
    private Integer avgDeliveryTimeMin = 0;

    @Builder.Default
    private Integer slaBreaches = 0;

    @Builder.Default
    private Integer incidentCount = 0;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
