package com.deliveryplatform.service;

public interface WebhookService {
    void handlePayPalWebhook(String payload, String signature, String transmissionId, String transmissionTime, String certUrl, String authAlgo, String webhookId);
}
