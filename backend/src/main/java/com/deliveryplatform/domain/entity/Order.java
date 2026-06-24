package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@org.hibernate.annotations.SQLDelete(sql = "UPDATE orders SET deleted = true WHERE id = ?")
@org.hibernate.annotations.Where(clause = "deleted = false")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

    @Column(unique = true, nullable = false)
    private String trackingNumber;

    private String barcode;
    private String barcodeImagePath;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private String pickupAddress;
    private String deliveryAddress;
    private String senderCity;
    private String receiverCity;
    private String pickupContactName;
    private String receiverName;
    private String receiverPhone;

    private Double pickupLat;
    private Double pickupLng;
    private Double deliveryLat;
    private Double deliveryLng;

    private Double distance;
    private Integer estimatedTime;

    // ✅ Financial fields (fixed)
    private BigDecimal codAmount;
    private BigDecimal deliveryFee;       // Fee paid to driver
    private BigDecimal driverEarnings;    // Driver earnings

    @Builder.Default
    private boolean urgent = false;

    @Builder.Default
    private boolean heavy = false;

    @Builder.Default
    private boolean codCollected = false;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private User client;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @ManyToOne
    @JoinColumn(name = "agency_id")
    private Agency agency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private AgencyCustomer customer;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime pickupDate;
    private LocalDateTime deliveryStartedDate;

    // Task Management
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private OrderPriority priority = OrderPriority.MEDIUM;

    private LocalDateTime deadline;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SLAStatus slaStatus = SLAStatus.ON_TRACK;

    @Builder.Default
    private Integer reassignmentCount = 0;

    private LocalDateTime lastAssignedAt;

    // Delivery proof
    @Column(name = "delivery_proof_type")
    private String deliveryProofType;

    @Column(name = "delivery_proof_photo_url")
    private String deliveryProofPhotoUrl;

    @Column(name = "delivery_proof_pin")
    private String deliveryProofPin;

    @Column(columnDefinition = "TEXT")
    private String deliveryNotes;

    // Payment
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    private LocalDateTime paymentConfirmedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_confirmed_by_id")
    private User paymentConfirmedBy;

    @Version
    private Long version;

    private LocalDateTime assignedAt;
    private LocalDateTime deliveredAt;

    @Builder.Default
    @Column(name = "validated", nullable = false)
    private boolean validated = false;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @Builder.Default
    @Column(name = "cash_confirmed", nullable = false)
    private boolean cashConfirmed = false;

    @Column(name = "cash_confirmed_at")
    private LocalDateTime cashConfirmedAt;

    @Builder.Default
    @Column(name = "cash_collected", nullable = false)
    private boolean cashCollected = false;

    @Column(name = "cash_collected_at")
    private LocalDateTime cashCollectedAt;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private DriverRating driverRating;

    private Integer sequenceIndex;
    private LocalDateTime currentEta;

    @Builder.Default
    private boolean delayAlertSent = false;

    private Integer pointsEarned;

    @Builder.Default
    private boolean deleted = false;
}