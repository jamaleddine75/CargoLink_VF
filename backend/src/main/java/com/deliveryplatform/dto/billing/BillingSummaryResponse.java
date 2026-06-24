package com.deliveryplatform.dto.billing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingSummaryResponse {
    private BigDecimal totalRevenue;
    private BigDecimal totalExpenses;
    private BigDecimal netProfit;
    private BigDecimal pendingReceivables;
    private BigDecimal pendingPayables;
    private BigDecimal currentWalletBalance;
}
