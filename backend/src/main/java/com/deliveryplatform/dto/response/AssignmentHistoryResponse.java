package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for assignment history information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentHistoryResponse {

    private UUID id;
    private java.util.UUID orderId;
    private UUID previousDriverId;
    private String previousDriverName;
    private UUID newDriverId;
    private String newDriverName;
    private String reason;
    private String notes;
    private String assignedBy;
    private String status;
    private LocalDateTime assignedAt;
    private LocalDateTime validUntil;
}
