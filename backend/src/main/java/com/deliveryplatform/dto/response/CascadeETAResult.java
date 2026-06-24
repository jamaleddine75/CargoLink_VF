package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CascadeETAResult {
    private List<StopETA> stops;
    private double totalRemainingKm;
    private int totalRemainingMin;
    private LocalDateTime estimatedEndTime;
    private String nextStopAddress;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StopETA {
        private java.util.UUID orderId;
        private String type; // PICKUP or DELIVERY
        private String address;
        private LocalDateTime eta;
        private double distanceKm;
        private double durationMin;
        private String slaStatus;
    }
}
