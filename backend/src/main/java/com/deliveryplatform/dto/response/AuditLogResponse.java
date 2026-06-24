package com.deliveryplatform.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogResponse {
    private String id;
    private String actor;
    private String action;
    private String target;
    private String ipAddress;
    private LocalDateTime timestamp;
}
