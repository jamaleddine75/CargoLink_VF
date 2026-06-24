package com.deliveryplatform.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FinanceSummaryResponse {
    private double totalRevenue;
    private double totalCommissions;
    private double currentBalance;
    private long totalTransactions;
}
