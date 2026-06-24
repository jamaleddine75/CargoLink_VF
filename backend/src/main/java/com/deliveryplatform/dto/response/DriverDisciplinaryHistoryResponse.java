package com.deliveryplatform.dto.response;

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
public class DriverDisciplinaryHistoryResponse {
    private UUID id;
    private String action;
    private String previousStatus;
    private String newStatus;
    private String reason;
    private String performedBy;
    private LocalDateTime createdAt;
}
