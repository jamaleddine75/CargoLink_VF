package com.deliveryplatform.event.finance;

import com.deliveryplatform.domain.entity.TransactionType;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
public class FinancialMutationEvent extends ApplicationEvent {
    
    private final UUID eventId;
    private final String correlationId;
    private final UUID referenceId; // e.g., OrderId, WithdrawalId, etc.
    private final EntityType entityType;
    private final UUID entityId; // The ID of the User, Agency, or Platform
    private final BigDecimal amount;
    private final String currency;
    private final TransactionType transactionType;
    private final UUID performedBy;
    private final String reason;
    private final LocalDateTime eventTimestamp;
    private final Map<String, Object> metadata;

    public enum EntityType {
        USER, AGENCY, PLATFORM
    }

    public FinancialMutationEvent(Object source, 
                                  String correlationId,
                                  UUID referenceId,
                                  EntityType entityType, 
                                  UUID entityId, 
                                  BigDecimal amount, 
                                  String currency,
                                  TransactionType transactionType,
                                  UUID performedBy, 
                                  String reason,
                                  Map<String, Object> metadata) {
        super(source);
        this.eventId = UUID.randomUUID();
        this.correlationId = correlationId;
        this.referenceId = referenceId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.amount = amount;
        this.currency = currency != null ? currency : "MAD";
        this.transactionType = transactionType;
        this.performedBy = performedBy;
        this.reason = reason;
        this.eventTimestamp = LocalDateTime.now();
        this.metadata = metadata;
    }
}
