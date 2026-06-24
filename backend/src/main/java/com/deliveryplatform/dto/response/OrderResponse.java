package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private String id;
    private String trackingNumber;
    private String barcode;
    private String barcodeImagePath;
    private String status;

    private String pickupAddress;
    private String deliveryAddress;
    private String senderCity;
    private String receiverCity;
    private String pickupContactName;
    private String receiverName;
    private String receiverPhone;

    // ✅ Financial fields (fixed)
    private BigDecimal codAmount;
    private BigDecimal deliveryFee;
    private BigDecimal driverEarnings;

    // ✅ Flags (from second branch - keep them)
    private boolean urgent;
    private boolean heavy;

    private String clientName;
    private String driverName;
    private String driverPhone;
    private String driverAvatarUrl;

    private Double driverLat;
    private Double driverLng;

    private String agencyName;

    private Double pickupLat;
    private Double pickupLng;
    private Double deliveryLat;
    private Double deliveryLng;
    private Double distance;
    private java.util.List<com.deliveryplatform.dto.response.TrackingHistoryResponse> trackingHistory;

    private LocalDateTime createdAt;
    private LocalDateTime assignedAt;
    private LocalDateTime deliveredAt;

    private String priority;
    private String slaStatus;
    private LocalDateTime deadline;

    private String deliveryProofType;
    private String deliveryProofPhotoUrl;
    private String deliveryNotes;
    private String notes; // Alias for deliveryNotes used by frontend

    private String paymentStatus;
    private LocalDateTime paymentConfirmedAt;

    private boolean validated;
    private LocalDateTime validatedAt;
    private boolean cashConfirmed;
    private LocalDateTime cashConfirmedAt;
    private boolean cashCollected;
    private LocalDateTime cashCollectedAt;

    private boolean isRated;
    
    // Tracking fields
    private Integer sequenceIndex;
    private LocalDateTime currentEta;
    private boolean delayAlertSent;
    private Integer pointsEarned;

    private List<OrderItemResponse> items;
}