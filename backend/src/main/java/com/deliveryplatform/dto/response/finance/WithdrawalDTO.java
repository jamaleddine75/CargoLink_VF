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
    @com.fasterxml.jackson.annotation.JsonProperty("ownerName")
    private String userName;
    @com.fasterxml.jackson.annotation.JsonProperty("ownerRole")
    private String userRole;
    private UUID walletId;
    private BigDecimal amount;
    private String method;
    private String bankDetails;
    private String status;
    private String rejectionReason;
    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    private LocalDateTime requestedAt;
    @com.fasterxml.jackson.annotation.JsonProperty("updatedAt")
    private LocalDateTime processedAt;
}
