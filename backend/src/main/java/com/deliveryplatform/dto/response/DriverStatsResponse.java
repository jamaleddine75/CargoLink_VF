package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverStatsResponse {
    private int totalOrders;
    private int completedOrders;
    private java.math.BigDecimal totalEarnings;
    private double averageRating;
    private double successRate;
    private java.math.BigDecimal pendingCOD;
    private java.math.BigDecimal weeklyCommission;
    private int todayFailed;
}
