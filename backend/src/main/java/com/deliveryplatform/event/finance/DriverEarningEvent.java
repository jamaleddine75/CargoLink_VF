package com.deliveryplatform.event.finance;

import com.deliveryplatform.domain.entity.TransactionType;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public class DriverEarningEvent extends FinancialMutationEvent {
    public DriverEarningEvent(Object source, String correlationId, UUID orderId, UUID driverUserId, BigDecimal amount) {
        super(source, correlationId, orderId, EntityType.USER, driverUserId, amount, "MAD", TransactionType.GAIN, null, "Driver Earnings", Map.of("orderId", orderId));
    }
}
