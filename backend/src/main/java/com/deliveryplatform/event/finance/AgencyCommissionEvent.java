package com.deliveryplatform.event.finance;

import com.deliveryplatform.domain.entity.TransactionType;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public class AgencyCommissionEvent extends FinancialMutationEvent {
    public AgencyCommissionEvent(Object source, String correlationId, UUID orderId, UUID agencyId, BigDecimal amount) {
        // We use COMMISSION type, and EntityType.AGENCY. 
        // The event listener will route this to AgencyTransaction table.
        super(source, correlationId, orderId, EntityType.AGENCY, agencyId, amount, "MAD", TransactionType.COMMISSION, null, "Agency Commission", Map.of("orderId", orderId));
    }
}
