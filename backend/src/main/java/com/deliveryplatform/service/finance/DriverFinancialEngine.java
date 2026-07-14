package com.deliveryplatform.service.finance;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public interface DriverFinancialEngine {
    Map<String, BigDecimal> calculateDriverBalanceMetrics(UUID driverId);
}
