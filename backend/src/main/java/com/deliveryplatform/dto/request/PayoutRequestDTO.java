package com.deliveryplatform.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayoutRequestDTO {
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be strictly positive")
    private BigDecimal amount;
    
    private java.util.UUID paymentAccountId;
}
