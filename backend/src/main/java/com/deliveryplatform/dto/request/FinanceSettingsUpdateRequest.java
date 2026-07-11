package com.deliveryplatform.dto.request;

import com.deliveryplatform.domain.entity.ClientSettlementFormula;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceSettingsUpdateRequest {

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "1.0", inclusive = true)
    private BigDecimal platformFeeRate;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "1.0", inclusive = true)
    private BigDecimal defaultAgencyCommissionRate;

    @NotNull
    private ClientSettlementFormula clientSettlementFormula;

    @NotNull
    private Boolean autoReconcileDailyBatch;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal debtAlertThreshold;
}
