package com.deliveryplatform.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    @NotBlank(message = "Pickup address is required")
    private String pickupAddress;

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;
    
    @NotBlank(message = "Sender city is required")
    private String senderCity;

    @NotBlank(message = "Receiver city is required")
    private String receiverCity;

    @NotBlank(message = "Pickup contact name is required")
    private String pickupContactName;

    @NotBlank(message = "Receiver name is required")
    private String receiverName;

    @NotBlank(message = "Receiver phone is required")
    private String receiverPhone;

    private Double pickupLat;

    private Double pickupLng;

    private Double deliveryLat;

    private Double deliveryLng;

    @NotNull(message = "COD amount is required")
    @PositiveOrZero(message = "COD amount must be positive or zero")
    private java.math.BigDecimal codAmount;

    // Optional fields
    private Double distance;
    private Integer estimatedTime;
    private java.math.BigDecimal deliveryFee;
    private String priority;      // LOW, MEDIUM, HIGH, CRITICAL
    private String deadline;      // ISO datetime string
    private boolean urgent;
    private boolean heavy;

    private String notes;
    private List<OrderItemRequest> items;
}