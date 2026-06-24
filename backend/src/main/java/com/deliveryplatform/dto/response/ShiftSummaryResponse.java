package com.deliveryplatform.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShiftSummaryResponse {
    private String  shiftId;
    private String  startedAt;
    private String  endedAt;
    private boolean isActive;
    private int     totalDeliveries;
    private int     successfulDeliveries;
    private int     failedDeliveries;
    private double  totalEarnings;
    private double  totalCOD;
    private double  totalDistanceKm;
    private int     avgDeliveryTimeMin;
    private int     slaBreaches;
    private int     incidentCount;
}
