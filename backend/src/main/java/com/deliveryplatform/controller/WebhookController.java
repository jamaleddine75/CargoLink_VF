package com.deliveryplatform.controller;

import com.deliveryplatform.service.WebhookService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookService webhookService;

    @PostMapping("/paypal")
    public ResponseEntity<Void> handlePayPalWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "PAYPAL-TRANSMISSION-SIG", required = false) String signature,
            @RequestHeader(value = "PAYPAL-TRANSMISSION-ID", required = false) String transmissionId,
            @RequestHeader(value = "PAYPAL-TRANSMISSION-TIME", required = false) String transmissionTime,
            @RequestHeader(value = "PAYPAL-CERT-URL", required = false) String certUrl,
            @RequestHeader(value = "PAYPAL-AUTH-ALGO", required = false) String authAlgo,
            @RequestHeader(value = "PAYPAL-WEBHOOK-ID", required = false) String webhookId,
            HttpServletRequest request) {
        
        // Passing headers to service for validation and payload processing
        webhookService.handlePayPalWebhook(payload, signature, transmissionId, transmissionTime, certUrl, authAlgo, webhookId);
        
        // Always return 200 OK so PayPal doesn't infinitely retry unless we throw an exception
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
