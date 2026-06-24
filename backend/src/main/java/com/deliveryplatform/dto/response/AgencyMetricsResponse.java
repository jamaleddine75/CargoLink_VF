package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgencyMetricsResponse {
    private long totalOrders;
    private BigDecimal totalRevenue; // As requested in the DTO layer requirement
    private long activeDrivers;
    
    // Required by service implementation
    private long pendingPickups;
    private long ongoingDeliveries;
    private long issuesCount;
    private List<Map<String, Object>> weeklyOrders;
    private List<Map<String, Object>> driversStatus;
    
    // Wallet metrics
    private java.math.BigDecimal walletBalance;   // Current balance in agency wallet
    private java.math.BigDecimal pendingCOD;      // Pending COD amount from drivers
}
