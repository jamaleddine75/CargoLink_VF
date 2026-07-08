package com.deliveryplatform.listener.finance;

import com.deliveryplatform.event.finance.FinancialMutationEvent;
import com.deliveryplatform.service.WebSocketEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class FinancialWebSocketListener {

    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleFinancialWebSocket(FinancialMutationEvent event) {
        log.debug("Processing WebSocket broadcast for Event: {}", event.getEventId());

        try {
            if (event.getEntityType() == FinancialMutationEvent.EntityType.USER) {
                messagingTemplate.convertAndSend("/topic/wallet/" + event.getEntityId(), 
                    Map.of(
                        "type", "WALLET_UPDATED", 
                        "amount", event.getAmount(),
                        "transactionType", event.getTransactionType().name(),
                        "reason", event.getReason()
                    )
                );
            }
            
            // Broadcast to global admin topics for live dashboards
            messagingTemplate.convertAndSend("/topic/finance/live", 
                Map.of(
                    "entityType", event.getEntityType().name(),
                    "entityId", event.getEntityId(),
                    "amount", event.getAmount(),
                    "transactionType", event.getTransactionType().name()
                )
            );
        } catch (Exception e) {
            log.error("Failed to push websocket update for event {}", event.getEventId(), e);
        }
    }
}
