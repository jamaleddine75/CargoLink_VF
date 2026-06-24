package com.deliveryplatform.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalRequestDTO {
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "100", message = "Minimum withdrawal amount is 100 MAD")
    private java.math.BigDecimal amount;

    @NotBlank(message = "Bank account is required")
    private String bankAccount;

    @NotBlank(message = "Account holder name is required")
    private String accountHolder;
}
