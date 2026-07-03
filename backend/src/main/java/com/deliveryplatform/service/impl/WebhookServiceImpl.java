package com.deliveryplatform.service.impl;

import com.deliveryplatform.service.PaymentProvider;
import com.deliveryplatform.service.WebhookService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookServiceImpl implements WebhookService {

    private final PaymentProvider paymentProvider;
    private final WalletServiceImpl walletService;
    private final ObjectMapper objectMapper;

    @Override
    public void handlePayPalWebhook(String payload, String signature, String transmissionId, String transmissionTime, String certUrl, String authAlgo, String webhookId) {
        log.info("Received PayPal webhook: {}", payload);
        
        try {
            JsonNode root = objectMapper.readTree(payload);
            String eventType = root.path("event_type").asText();
            JsonNode resource = root.path("resource");
            String payoutItemId = resource.path("payout_item_id").asText();
            String payoutBatchId = resource.path("payout_batch_id").asText();

            if (payoutItemId == null || payoutItemId.isEmpty()) {
                log.warn("Webhook ignored: No payout_item_id found in resource");
                return;
            }

            switch (eventType) {
                case "PAYMENT.PAYOUTS-ITEM.SUCCEEDED":
                    log.info("Processing SUCCEEDED webhook for item {}", payoutItemId);
                    walletService.finalizeSuccessfulWithdrawal(payoutItemId);
                    break;
                case "PAYMENT.PAYOUTS-ITEM.FAILED":
                case "PAYMENT.PAYOUTS-ITEM.DENIED":
                case "PAYMENT.PAYOUTS-ITEM.BLOCKED":
                    log.info("Processing FAILED webhook for item {}", payoutItemId);
                    String reason = resource.path("errors").path("message").asText("Unknown Error");
                    walletService.finalizeFailedWithdrawal(payoutItemId, reason);
                    break;
                default:
                    log.info("Ignored webhook event type: {}", eventType);
                    break;
            }
        } catch (Exception e) {
            log.error("Failed to parse or process webhook payload", e);
            throw new RuntimeException("Webhook processing failed", e);
        }
    }
}
