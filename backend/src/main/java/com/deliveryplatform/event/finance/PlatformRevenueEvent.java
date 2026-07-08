package com.deliveryplatform.event.finance;

import com.deliveryplatform.domain.entity.TransactionType;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public class PlatformRevenueEvent extends FinancialMutationEvent {
    public PlatformRevenueEvent(Object source, String correlationId, UUID orderId, UUID platformWalletId, BigDecimal amount) {
        super(source, correlationId, orderId, EntityType.PLATFORM, platformWalletId, amount, "MAD", TransactionType.PLATFORM_REVENUE, null, "Platform Delivery Fee", Map.of("orderId", orderId));
    }
}
