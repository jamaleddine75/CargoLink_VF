package com.deliveryplatform.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalAgencies;
    private long totalDrivers;
    private long totalClients;
    private long totalOrders;
    private java.math.BigDecimal totalRevenue;
    private List<Map<String, Object>> monthlyRevenue;
    private List<Map<String, Object>> agencyBreakdown;
    private long pendingPayouts;
}
