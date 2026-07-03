package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.PaymentAccount;
import com.deliveryplatform.domain.entity.PayoutLog;
import com.deliveryplatform.domain.entity.WithdrawalRequest;
import jakarta.servlet.http.HttpServletRequest;

import java.math.BigDecimal;
import java.util.UUID;

public interface PaymentProvider {
    void authenticate();
    
    // Abstracted parameters so it works for AgencyPayoutRequest too
    PayoutLog createPayout(UUID withdrawalId, String referenceId, BigDecimal amount, String currency, PaymentAccount account);
    
    boolean verifyWebhook(HttpServletRequest request);
    
    PayoutLog getPayoutStatus(String batchId);
    
    void cancelPayout(String batchId);
}
