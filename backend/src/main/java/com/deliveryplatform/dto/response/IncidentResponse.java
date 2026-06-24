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
public class IncidentResponse {
    private UUID id;
    private java.util.UUID orderId;
    private String title;
    private String description;
    private String category;
    private String type;
    private String status;
    private String resolution;
    private String orderTrackingNumber;
    private String driverName;
    private String driverId;
    private String priority;
    private UUID assignedTo;
    private String assignedToName;
    private String notes;
    private String attachments;
    private String source;
    private UUID clientId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
