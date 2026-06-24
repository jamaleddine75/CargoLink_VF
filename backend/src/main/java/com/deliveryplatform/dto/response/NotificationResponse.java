package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private UUID id;
    private String title;
    private String message;
    private String type;
    private boolean isRead;
    private UUID userId;
    private String recipientRole;
    private String recipientEmail;
    private List<String> targetRoles;
    private LocalDateTime createdAt;
}
