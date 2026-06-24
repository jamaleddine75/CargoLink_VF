package com.deliveryplatform.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class WeeklyPerformanceResponse {
    private String          week;
    private List<DayStats>  days;
    private double          totalEarnings;
    private int             totalDeliveries;
    private double          avgSuccessRate;
    private String          topDay;
    private int             rank;
    private int             totalDrivers;

    @Data
    @Builder
    public static class DayStats {
        private String date;
        private int    deliveries;
        private double earnings;
        private double successRate;
    }
}
