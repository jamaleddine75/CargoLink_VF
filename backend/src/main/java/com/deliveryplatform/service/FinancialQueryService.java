package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.finance.FinancialSummaryDTO;
import com.deliveryplatform.dto.response.finance.AnalyticsDTO;

public interface FinancialQueryService {
    FinancialSummaryDTO getOverviewKPIs();
    AnalyticsDTO getAnalyticsSummary();
}
