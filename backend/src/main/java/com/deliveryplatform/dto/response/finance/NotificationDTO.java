package com.deliveryplatform.dto.response.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private UUID id;
    private String type; // "CRITICAL", "WARNING", "INFO"
    private String category; // "LARGE_TRANSACTION", "FRAUD_ALERT", etc.
    private String message;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
