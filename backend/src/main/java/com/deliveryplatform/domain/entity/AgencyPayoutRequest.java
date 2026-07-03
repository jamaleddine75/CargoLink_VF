package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "agency_payout_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgencyPayoutRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "agency_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Agency agency;

    @Column(nullable = false)
    private java.math.BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status; // PENDING, PROCESSING, COMPLETED, REJECTED

    private String rejectionReason;

    private String paypalBatchId;

    private String paypalItemId;

    @Column(nullable = false)
    private UUID paymentAccountId;

    @Column(nullable = false)
    private String receiverEmailSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentProviderEnum provider = PaymentProviderEnum.PAYPAL;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime processedAt;
}
