package com.deliveryplatform.dto.request;

import com.deliveryplatform.domain.entity.PaymentProviderEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreatePaymentAccountRequest {
    @NotNull(message = "Provider is required")
    private PaymentProviderEnum provider;

    @NotBlank(message = "Account identifier is required")
    private String accountIdentifier;
    
    private boolean isDefault = true;

    private String preferredCurrency = "MAD";
}
