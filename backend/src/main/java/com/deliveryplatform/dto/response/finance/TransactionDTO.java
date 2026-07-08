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
public class TransactionDTO {
    private UUID id;
    private String type;
    private BigDecimal amount;
    private String status;
    private String description;
    
    // Wallet info
    private UUID walletId;
    
    // Owner Info
    private String ownerName;
    private String ownerRole; // "AGENCY", "DRIVER", "CUSTOMER"
    
    private LocalDateTime createdAt;
}
