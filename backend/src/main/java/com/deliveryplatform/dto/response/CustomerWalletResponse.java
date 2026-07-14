package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerWalletResponse {
    private String id;
    private BigDecimal balance;
    private BigDecimal totalCOD;
    private BigDecimal totalFees;
    private BigDecimal pendingCOD;
    private int totalOrders;
    private BigDecimal weeklyCOD;
    private BigDecimal availableBalance;
    private Integer loyaltyPoints;
    private Integer pointsThisMonth;
}
