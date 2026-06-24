package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteStopDTO {
    private java.util.UUID orderId;
    private String trackingNumber;
    private String type; // PICKUP or DELIVERY
    private Double lat;
    private Double lng;
    private String address;
    private String contact;
    private String phone;
    private BigDecimal codAmount;
    private Integer sequenceIndex;
    private LocalDateTime estimatedArrival;
}
