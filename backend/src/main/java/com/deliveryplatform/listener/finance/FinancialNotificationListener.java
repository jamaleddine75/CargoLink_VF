package com.deliveryplatform.listener.finance;

import com.deliveryplatform.event.finance.FinancialMutationEvent;
import com.deliveryplatform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class FinancialNotificationListener {

    private final NotificationService notificationService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleFinancialNotification(FinancialMutationEvent event) {
        log.debug("Processing Financial Notification asynchronously for Event: {}", event.getEventId());

        if (event.getEntityType() == FinancialMutationEvent.EntityType.USER) {
            String message = String.format("Your wallet was updated by %s MAD. Reason: %s", 
                    event.getAmount(), event.getReason());
            
            try {
                notificationService.createNotification(event.getEntityId(), message, "FINANCE");
            } catch (Exception e) {
                log.error("Failed to send financial notification for event {}. This will NOT rollback the ledger.", event.getEventId(), e);
            }
        }
    }
}
