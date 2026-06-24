package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientKPIsResponse {
    private long totalSent;
    private long inTransit;
    private long delivered;
    private BigDecimal pendingPayment;
}
