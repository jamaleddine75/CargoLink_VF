package com.deliveryplatform.dto.response.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDTO {
    private List<TopPerformer> topAgencies;
    private List<TopPerformer> topDrivers;
    private List<TopPerformer> topCustomers;
    private List<TopWallet> mostActiveWallets;
    
    private BigDecimal highestRevenue;
    private BigDecimal lowestRevenue;
    private BigDecimal profitMargin;
    private BigDecimal monthlyGrowth;
    private BigDecimal netProfit;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopPerformer {
        private UUID id;
        private String name;
        private BigDecimal revenue;
        private Long transactionCount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopWallet {
        private UUID walletId;
        private String ownerName;
        private BigDecimal growth;
        private Long volume;
    }
}
