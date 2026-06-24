package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalRequestResponse {
    private String id;                  // UUID
    private java.math.BigDecimal amount;              // Withdrawal amount
    private String bankAccount;         // IBAN or account (masked)
    private String accountHolder;       // Account holder name
    private String status;              // PENDING, COMPLETED, REJECTED, FAILED
    private LocalDateTime createdAt;    // Request creation date
    private LocalDateTime completedAt;  // Completion date (null if pending)
    private String rejectionReason;     // Reason if REJECTED (optional)
}
