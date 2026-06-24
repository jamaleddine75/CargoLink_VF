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
public class CODReconciliationRequest {
    private UUID orderId;
    private UUID driverId;
    private BigDecimal expectedAmount;
    private BigDecimal receivedAmount;
    private String notes;
}
