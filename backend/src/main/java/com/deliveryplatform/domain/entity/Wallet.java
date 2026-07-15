package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "wallets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private User user;

    @Builder.Default
    private java.math.BigDecimal balance = java.math.BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "cash_in_hand")
    private java.math.BigDecimal cashInHand = java.math.BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "debt_to_system")
    private java.math.BigDecimal debtToSystem = java.math.BigDecimal.ZERO;

    @Builder.Default
    private boolean isFrozen = false;

    @Column(name = "frozen_reason", length = 500)
    private String frozenReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "wallet_type", length = 20)
    @Builder.Default
    private WalletType walletType = WalletType.DRIVER;

}
