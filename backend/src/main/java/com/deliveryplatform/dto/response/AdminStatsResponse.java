package com.deliveryplatform.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class AdminStatsResponse {
    private long totalAgencies;
    private long totalDrivers;
    private long totalClients;
    private long totalOrders;
    private java.math.BigDecimal totalRevenue;
    private long ordersToday;
    private long driversOnline;
    private List<MonthlyRevenueDTO> monthlyRevenue;
    private List<AgencyBreakdownDTO> agencyBreakdown;
    private long pendingPayouts;
    private SystemHealthDTO systemHealth;

    @Data
    @Builder
    public static class MonthlyRevenueDTO {
        private String name;
        private java.math.BigDecimal revenue;
        private long orders;
    }

    @Data
    @Builder
    public static class AgencyBreakdownDTO {
        private String id;
        private String name;
        private long orders;
        private double commission;
        private long drivers;
    }

    @Data
    @Builder
    public static class SystemHealthDTO {
        private int activeConnections;
        private double averageResponseTime;
        private long uptime;
    }
}
