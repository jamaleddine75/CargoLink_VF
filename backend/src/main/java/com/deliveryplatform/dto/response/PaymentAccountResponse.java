package com.deliveryplatform.dto.response;

import com.deliveryplatform.domain.entity.PaymentProviderEnum;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PaymentAccountResponse {
    private UUID id;
    private PaymentProviderEnum provider;
    private String accountIdentifier;
    private boolean verified;
    private LocalDateTime verifiedAt;
    private boolean isDefault;
    private String preferredCurrency;
    private String status;
}
