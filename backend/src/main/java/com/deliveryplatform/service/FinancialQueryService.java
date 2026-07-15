package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.finance.FinancialSummaryDTO;
import com.deliveryplatform.dto.response.finance.AnalyticsDTO;
import java.util.List;
import java.util.Map;

public interface FinancialQueryService {
    FinancialSummaryDTO getOverviewKPIs();
    AnalyticsDTO getAnalyticsSummary();
    List<Map<String, Object>> getFraudAlerts();
    List<Map<String, Object>> getReconciliations();
    List<Map<String, Object>> getLedgerAccounts();
    List<Map<String, Object>> getJournalEntries();
}
