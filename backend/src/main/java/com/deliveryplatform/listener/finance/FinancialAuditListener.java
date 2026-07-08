package com.deliveryplatform.listener.finance;

import com.deliveryplatform.event.finance.FinancialMutationEvent;
import com.deliveryplatform.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class FinancialAuditListener {

    private final AuditLogService auditLogService;

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handleFinancialAudit(FinancialMutationEvent event) {
        log.debug("Processing Audit Log for Event: {} | EntityId: {}", event.getEventId(), event.getEntityId());
        
        // Use correlationId and other metadata to build a rich audit entry.
        String detailedReason = String.format("[%s] %s (Ref: %s)", 
                event.getCorrelationId(), 
                event.getReason(), 
                event.getReferenceId());

        auditLogService.logFinancialAction(
                event.getPerformedBy(), 
                event.getTransactionType().name(), 
                event.getEntityId(), 
                event.getAmount(), 
                detailedReason
        );
    }
}
