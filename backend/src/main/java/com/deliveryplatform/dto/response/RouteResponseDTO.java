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
public class RouteResponseDTO {
    private UUID driverId;
    private List<RouteStopDTO> stops;
    private double totalDistance;
    private int totalDuration;
    private LocalDateTime estimatedEndTime;
    private LocalDateTime lastOptimizedAt;
}
