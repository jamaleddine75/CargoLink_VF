package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceResponse {
    private BigDecimal totalCod;
    private BigDecimal pendingCod;
    private BigDecimal paidCod;
    private List<TransactionResponse> transactions;
}
