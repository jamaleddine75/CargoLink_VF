package com.deliveryplatform.controller;

import com.deliveryplatform.domain.entity.PaymentAccount;
import com.deliveryplatform.domain.entity.PaymentProviderEnum;
import com.deliveryplatform.domain.entity.PayoutLog;
import com.deliveryplatform.service.PaymentProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/v3/api-docs")
@RequiredArgsConstructor
public class TestPayPalController {

    private final PaymentProvider paymentProvider;

    @PostMapping("/paypal-payout")
    public ResponseEntity<PayoutLog> testPayPalPayout() {
        PaymentAccount account = new PaymentAccount();
        account.setProvider(PaymentProviderEnum.PAYPAL);
        account.setAccountIdentifier("sb-xodmk51075559@personal.example.com");

        // The task said sender_batch_id: TEST-{timestamp}.
        // Our implementation appends "WD-" to the ID passed in. 
        // We will pass a random UUID so it becomes WD-{random_uuid}.
        UUID testId = UUID.randomUUID();

        PayoutLog log = paymentProvider.createPayout(testId, "TEST-" + System.currentTimeMillis(), new BigDecimal("100.00"), new BigDecimal("10.00"), "USD", account);
        
        return ResponseEntity.ok(log);
    }
}
