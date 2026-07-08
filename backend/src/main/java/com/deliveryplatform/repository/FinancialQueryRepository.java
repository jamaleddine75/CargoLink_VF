package com.deliveryplatform.repository;

import com.deliveryplatform.dto.response.finance.FinancialSummaryDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public class FinancialQueryRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public FinancialSummaryDTO getFinancialKPIs() {
        String sql = "SELECT * FROM v_financial_kpis";
        
        try {
            Object[] result = (Object[]) entityManager.createNativeQuery(sql).getSingleResult();
            
            return FinancialSummaryDTO.builder()
                    .totalWalletBalance((BigDecimal) result[0])
                    .pendingWithdrawalsAmount((BigDecimal) result[1])
                    .frozenWalletsCount(((Number) result[2]).longValue())
                    .activeWalletsCount(((Number) result[3]).longValue())
                    .codPendingAmount((BigDecimal) result[4])
                    .codCollectedAmount((BigDecimal) result[5])
                    .todayRevenue((BigDecimal) result[6])
                    .weeklyRevenue((BigDecimal) result[7])
                    .monthlyRevenue((BigDecimal) result[8])
                    .build();
        } catch (Exception e) {
            // Fallback if view not ready or empty
            return FinancialSummaryDTO.builder()
                    .totalWalletBalance(BigDecimal.ZERO)
                    .pendingWithdrawalsAmount(BigDecimal.ZERO)
                    .frozenWalletsCount(0L)
                    .activeWalletsCount(0L)
                    .codPendingAmount(BigDecimal.ZERO)
                    .codCollectedAmount(BigDecimal.ZERO)
                    .todayRevenue(BigDecimal.ZERO)
                    .weeklyRevenue(BigDecimal.ZERO)
                    .monthlyRevenue(BigDecimal.ZERO)
                    .build();
        }
    }
}
