package com.deliveryplatform.dto.response.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialSummaryDTO {
    private BigDecimal platformBalance;
    private BigDecimal availableBalance;
    private BigDecimal reservedBalance;
    private BigDecimal totalWalletBalance;
    private BigDecimal todayRevenue;
    private BigDecimal weeklyRevenue;
    private BigDecimal monthlyRevenue;
    private BigDecimal yearlyRevenue;
    private BigDecimal totalRevenue;
    private BigDecimal platformProfit;
    private BigDecimal netProfit;
    private BigDecimal platformExpenses;
    private BigDecimal pendingWithdrawalsAmount;
    private BigDecimal pendingDepositsAmount;
    private BigDecimal codPendingAmount;
    private BigDecimal codCollectedAmount;
    private Long activeWalletsCount;
    private Long frozenWalletsCount;
    private Long activeAgenciesCount;
    private Long activeDriversCount;
}
