package com.deliveryplatform.dto.response;

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
public class TransactionResponse {
    private UUID id;
    private BigDecimal amount;
    private String type;
    private String description;
    private java.util.UUID orderId;
    private String trackingNumber; // Added for display
    private String deliveryAddress; // Added for display
    private BigDecimal codAmount; // Alias for amount
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime date; // alias for createdAt
    // Driver info for agency/admin views
    private String driverName;
    private String driverPhone;
    private UUID driverUserId;
    // Financial breakdown metadata (used for remittance confirmation screens)
    private java.util.Map<String, String> metadata;
    private String referenceIds;
}
