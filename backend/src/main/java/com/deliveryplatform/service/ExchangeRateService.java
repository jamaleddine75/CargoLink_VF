package com.deliveryplatform.service;

import java.math.BigDecimal;

public interface ExchangeRateService {
    BigDecimal convertMadToPayoutCurrency(BigDecimal mad);
    String getPayoutCurrency();
    BigDecimal getExchangeRate();
}
