package com.deliveryplatform.service.impl;

import com.deliveryplatform.service.ExchangeRateService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class FixedExchangeRateServiceImpl implements ExchangeRateService {

    @Value("${app.payments.payoutCurrency:USD}")
    private String payoutCurrency;

    @Value("${app.payments.exchangeRate:10.0}")
    private BigDecimal exchangeRate;

    @Override
    public BigDecimal convertMadToPayoutCurrency(BigDecimal mad) {
        if (mad == null) return BigDecimal.ZERO;
        if (exchangeRate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Exchange rate must be greater than zero");
        }
        return mad.divide(exchangeRate, 2, RoundingMode.HALF_UP);
    }

    @Override
    public String getPayoutCurrency() {
        return payoutCurrency;
    }

    @Override
    public BigDecimal getExchangeRate() {
        return exchangeRate;
    }
}
