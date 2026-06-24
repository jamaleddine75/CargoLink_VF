package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {
    private long totalOrders;
    private long ordersInProgress;
    private long deliveredOrders;
    private long activeDrivers;
    private long activeClients;
    
    // Trend fields
    private Double ordersTrend;
    private Double inProgressTrend;
    private Double deliveredTrend;
    private Double driversTrend;
    private Double clientsTrend;

    // Chart data
    private List<Map<String, Object>> ordersEvolution;
    private List<Map<String, Object>> ordersByStatus;
}
