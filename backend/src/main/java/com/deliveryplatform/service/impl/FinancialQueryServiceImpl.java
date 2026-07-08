package com.deliveryplatform.service.impl;

import com.deliveryplatform.dto.response.finance.FinancialSummaryDTO;
import com.deliveryplatform.dto.response.finance.AnalyticsDTO;
import com.deliveryplatform.repository.FinancialQueryRepository;
import com.deliveryplatform.service.FinancialQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinancialQueryServiceImpl implements FinancialQueryService {

    private final FinancialQueryRepository financialQueryRepository;

    @Override
    @Transactional(readOnly = true)
    public FinancialSummaryDTO getOverviewKPIs() {
        log.info("Fetching Financial Overview KPIs");
        return financialQueryRepository.getFinancialKPIs();
    }

    @Override
    @Transactional(readOnly = true)
    public AnalyticsDTO getAnalyticsSummary() {
        log.info("Fetching Financial Analytics Summary");
        // For now returning mock structure until MV implementation is fully bound to entities if needed, 
        // or we can just run native queries in FinancialQueryRepository for these too.
        return AnalyticsDTO.builder()
                .topAgencies(new ArrayList<>())
                .topDrivers(new ArrayList<>())
                .topCustomers(new ArrayList<>())
                .mostActiveWallets(new ArrayList<>())
                .highestRevenue(BigDecimal.ZERO)
                .lowestRevenue(BigDecimal.ZERO)
                .profitMargin(BigDecimal.ZERO)
                .monthlyGrowth(BigDecimal.ZERO)
                .netProfit(BigDecimal.ZERO)
                .build();
    }
}
