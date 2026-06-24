package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TourStatsResponse {
    private long totalOrders;
    private long completedOrders;
    private long pendingOrders;
    private double onTimeRate;
    private long delayedCount;
    private double totalDistanceCovered;
    private double totalDistanceRemaining;
    private double avgTimePerStop;
    private double currentEfficiency;
}
