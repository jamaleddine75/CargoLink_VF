package com.deliveryplatform.dto.response.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettingsDTO {
    private BigDecimal platformCommissionRate;
    private BigDecimal minWithdrawalAmount;
    private BigDecimal minWalletBalance;
    private Boolean autoPayoutEnabled;
    private String currency;
    private BigDecimal taxRate;
    private LocalDateTime updatedAt;
}
