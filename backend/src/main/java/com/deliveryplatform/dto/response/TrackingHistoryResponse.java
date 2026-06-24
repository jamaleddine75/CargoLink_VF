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
public class TrackingHistoryResponse {
    private UUID id;
    private String status;
    private Double latitude;
    private Double longitude;
    private String photoUrl;
    private String scanValue;
    private String comment;
    private LocalDateTime timestamp;
}
