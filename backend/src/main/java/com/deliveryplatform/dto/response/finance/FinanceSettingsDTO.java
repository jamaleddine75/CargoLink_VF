package com.deliveryplatform.dto.response.finance;

import com.deliveryplatform.domain.entity.ClientSettlementFormula;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceSettingsDTO {
    private UUID id;
    private BigDecimal platformFeeRate;
    private BigDecimal defaultAgencyCommissionRate;
    private ClientSettlementFormula clientSettlementFormula;
    private boolean autoReconcileDailyBatch;
    private BigDecimal debtAlertThreshold;
    private UUID updatedBy;
    private LocalDateTime updatedAt;
}
