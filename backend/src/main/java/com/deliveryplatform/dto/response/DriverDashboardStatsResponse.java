package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverDashboardStatsResponse {
    private int todayDelivered;
    private java.math.BigDecimal todayEarnings;
    private java.math.BigDecimal pendingCOD;
    private java.math.BigDecimal weeklyCommission;
    private Double successRate;
    private int activeOrderCount;
    private boolean isOnline;
    private String verificationStatus;
    private java.math.BigDecimal lastOrderEarnings;
    private String earningsTrend;
    private int todayFailed;
    private boolean isOnShift;
    private String shiftId;
    private Integer loyaltyPoints;
    // Backward compatibility with legacy frontend consumers
    private int completedToday;
    private java.math.BigDecimal earnings;
}
