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
public class AuditLogDTO {
    private UUID id;
    private String adminName;
    private String action;
    private String targetId;
    private String targetType;
    private String previousValue;
    private String newValue;
    private String reason;
    private String ipAddress;
    private String deviceInfo;
    private LocalDateTime createdAt;
}
