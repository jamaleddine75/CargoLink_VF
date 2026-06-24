package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchOptimizationResult {
    private List<ClusterSummary> clusters;
    private int totalOrdersOptimized;
    private double totalDistanceSaved;
    private LocalDateTime optimizedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClusterSummary {
        private int clusterIndex;
        private int orderCount;
        private UUID driverId;
        private String driverName;
        private double totalDistance;
        private double centroidLat;
        private double centroidLng;
    }
}
