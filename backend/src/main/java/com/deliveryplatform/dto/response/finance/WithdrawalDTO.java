package com.deliveryplatform.dto.response.finance;

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
public class WithdrawalDTO {
    private UUID id;
    private UUID userId;
    private String userName;
    private String userRole;
    private UUID walletId;
    private BigDecimal amount;
    private String method; // e.g. "BANK_TRANSFER", "PAYPAL"
    private String bankDetails;
    private String status; // "PENDING", "APPROVED", "REJECTED", "CANCELLED"
    private String rejectionReason;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
}
