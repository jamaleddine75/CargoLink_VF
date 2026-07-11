package com.deliveryplatform.dto.response.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletOverviewDTO {
    private UUID walletId;
    private UUID ownerId;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;
    private String userType; // "AGENCY", "DRIVER", "CUSTOMER", "PLATFORM"
    private String agencyName; // Only if driver belongs to agency
    private BigDecimal balance;
    private BigDecimal availableBalance;
    private BigDecimal reservedBalance;
    private BigDecimal frozenBalance;
    private BigDecimal pendingBalance;
    private BigDecimal cashInHand;
    private BigDecimal debtToSystem;
    private Boolean isFrozen;
    private String status; // "ACTIVE", "FROZEN"
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
