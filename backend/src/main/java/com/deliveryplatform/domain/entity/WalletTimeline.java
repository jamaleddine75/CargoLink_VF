package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "wallet_timeline")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletTimeline {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "wallet_id", nullable = false)
    private UUID walletId;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String reference;

    @Column(nullable = false, length = 50)
    private String status = "COMPLETED";

    @Column(length = 255)
    private String actor;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
