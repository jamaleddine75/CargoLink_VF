package com.deliveryplatform.service;

import java.util.Map;

public interface ReportService {
    Map<String, Object> getFinancialReport(String period);
    Map<String, Object> getOperationsReport(String period);
}