package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletResponse {
    private String id;
    private java.math.BigDecimal balance;
    private java.math.BigDecimal cashInHand;
    private java.math.BigDecimal debtToSystem;
    private java.math.BigDecimal totalEarned;
    private java.math.BigDecimal pendingCOD;
    private java.math.BigDecimal pendingCodTotal; // Spec requirement
    private java.math.BigDecimal weeklyEarnings; // Spec requirement
    private java.math.BigDecimal todayEarnings;
    private java.math.BigDecimal monthlyEarnings; // Spec requirement
    private Integer totalDeliveries; // Spec requirement
    private java.math.BigDecimal deductions;
    private java.math.BigDecimal weeklyCommission;
    private String accountStatus;       // VERIFIED, PENDING, REJECTED
    private LocalDate nextPayoutDate;   // Next Monday payout date
}
