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

    @org.springframework.beans.factory.annotation.Value("${paypal.client-id:}")
    private String clientId;

    @org.springframework.beans.factory.annotation.Value("${paypal.secret:}")
    private String secret;

    @org.springframework.beans.factory.annotation.Value("${paypal.mode:sandbox}")
    private String mode;

    @org.springframework.beans.factory.annotation.Value("${paypal.webhook-id:}")
    private String configuredWebhookId;

    @Override
    public void handlePayPalWebhook(String payload, String signature, String transmissionId, String transmissionTime, String certUrl, String authAlgo, String webhookId) {
        log.info("Webhook received");
        log.info("Verifying PayPal signature...");

        boolean isValid = verifySignatureWithPayPal(payload, signature, transmissionId, transmissionTime, certUrl, authAlgo, webhookId);

        if (!isValid) {
            log.warn("Signature INVALID");
            log.warn("Ignoring request");
            return;
        }

        log.info("Signature VALID");
        
        try {
            JsonNode root = objectMapper.readTree(payload);
            String eventType = root.path("event_type").asText();
            JsonNode resource = root.path("resource");
            String payoutItemId = resource.path("payout_item_id").asText();
            String senderItemId = resource.path("payout_item").path("sender_item_id").asText();

            log.info("Webhook event:\n{}", eventType);

            if (payoutItemId == null || payoutItemId.isEmpty()) {
                log.warn("Webhook ignored: No payout_item_id found in resource");
                return;
            }

            java.util.UUID withdrawalId = null;
            if (senderItemId != null && senderItemId.startsWith("ITEM-")) {
                try {
                    withdrawalId = java.util.UUID.fromString(senderItemId.substring(5));
                } catch (IllegalArgumentException e) {
                    log.warn("Webhook ignored: Invalid UUID in sender_item_id: {}", senderItemId);
                    return;
                }
            } else {
                log.warn("Webhook ignored: Could not extract withdrawalId from sender_item_id: {}", senderItemId);
                return;
            }

            switch (eventType) {
                case "PAYMENT.PAYOUTS-ITEM.SUCCEEDED":
                    log.info("Finding WithdrawalRequest...");
                    log.info("Updating Transaction...");
                    log.info("Updating Wallet...");
                    walletService.finalizeSuccessfulWithdrawal(withdrawalId, payoutItemId);
                    log.info("Status -> COMPLETED");
                    break;
                case "PAYMENT.PAYOUTS-ITEM.FAILED":
                case "PAYMENT.PAYOUTS-ITEM.DENIED":
                case "PAYMENT.PAYOUTS-ITEM.BLOCKED":
                    String reason = resource.path("errors").path("message").asText("Unknown Error");
                    walletService.finalizeFailedWithdrawal(withdrawalId, payoutItemId, reason);
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

    private boolean verifySignatureWithPayPal(String payload, String signature, String transmissionId, String transmissionTime, String certUrl, String authAlgo, String webhookId) {
        try {
            String baseUrl = "sandbox".equalsIgnoreCase(mode) ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
            
            // Generate token
            String auth = java.util.Base64.getEncoder().encodeToString((clientId + ":" + secret).getBytes());
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            
            org.springframework.http.HttpHeaders authHeaders = new org.springframework.http.HttpHeaders();
            authHeaders.set("Authorization", "Basic " + auth);
            authHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);
            
            org.springframework.http.HttpEntity<String> authRequest = new org.springframework.http.HttpEntity<>("grant_type=client_credentials", authHeaders);
            java.util.Map tokenResponse = restTemplate.postForObject(baseUrl + "/v1/oauth2/token", authRequest, java.util.Map.class);
            String accessToken = (String) tokenResponse.get("access_token");

            // Verify signature using the verbatim raw payload
            String verifyWebhookId = (configuredWebhookId != null && !configuredWebhookId.isEmpty()) ? configuredWebhookId : webhookId;
            
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String requestJson = "{" +
                "\"auth_algo\":" + mapper.writeValueAsString(authAlgo) + "," +
                "\"cert_url\":" + mapper.writeValueAsString(certUrl) + "," +
                "\"transmission_id\":" + mapper.writeValueAsString(transmissionId) + "," +
                "\"transmission_sig\":" + mapper.writeValueAsString(signature) + "," +
                "\"transmission_time\":" + mapper.writeValueAsString(transmissionTime) + "," +
                "\"webhook_id\":" + mapper.writeValueAsString(verifyWebhookId) + "," +
                "\"webhook_event\":" + payload +
            "}";

            org.springframework.http.HttpHeaders verifyHeaders = new org.springframework.http.HttpHeaders();
            verifyHeaders.set("Authorization", "Bearer " + accessToken);
            verifyHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

            org.springframework.http.HttpEntity<String> verifyRequest = new org.springframework.http.HttpEntity<>(requestJson, verifyHeaders);
            java.util.Map response = restTemplate.postForObject(baseUrl + "/v1/notifications/verify-webhook-signature", verifyRequest, java.util.Map.class);
            
            if (response != null && "SUCCESS".equals(response.get("verification_status"))) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("Error verifying webhook signature", e);
            return false;
        }
    }
}
