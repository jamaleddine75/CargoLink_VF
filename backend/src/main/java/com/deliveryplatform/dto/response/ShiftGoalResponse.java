package com.deliveryplatform.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShiftGoalResponse {
    private String id;
    private String label;
    private double current;
    private double target;
    private String unit;
    private String type; // DELIVERIES | EARNINGS | SUCCESS_RATE | DISTANCE
    private double pct;
}
