package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "platform_wallet")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Builder.Default
    @Column(nullable = false)
    private BigDecimal balance = BigDecimal.ZERO; // Total liquidity held by system

    @Builder.Default
    @Column(nullable = false)
    private BigDecimal totalRevenue = BigDecimal.ZERO; // Total flow of money (COD + Fees)

    @Builder.Default
    @Column(nullable = false)
    private BigDecimal platformProfit = BigDecimal.ZERO; // Admin's 5% share

    @Builder.Default
    @Column(nullable = false)
    private BigDecimal totalDriverPayout = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false)
    private BigDecimal totalAgencyPayout = BigDecimal.ZERO;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Version
    @Builder.Default
    private Long version = 0L;

}
