package com.deliveryplatform.dto.billing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverEarningRequest {
    private UUID driverId;
    private UUID orderId;
    private BigDecimal baseAmount;
    private BigDecimal commissionAmount;
    private BigDecimal bonusAmount;
    private BigDecimal penaltyAmount;
}
