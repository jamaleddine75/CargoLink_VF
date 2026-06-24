package com.deliveryplatform.service;

import java.util.Map;
import java.util.UUID;

public interface PayoutService {
    Map<String, Object> processMonthlyDriverPayouts();
    Map<String, Object> processMonthlyAgencyPayouts();
    Map<String, Object> payoutSingleDriver(UUID driverUserId);
    Map<String, Object> payoutSingleAgency(UUID agencyId);
}
