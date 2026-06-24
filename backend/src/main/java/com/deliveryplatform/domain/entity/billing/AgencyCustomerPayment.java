package com.deliveryplatform.domain.entity.billing;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.domain.entity.AgencyCustomer;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "agency_customer_payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE agency_customer_payments SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class AgencyCustomerPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private AgencyCustomerInvoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private AgencyCustomer customer;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "payment_method")
    private String paymentMethod;

    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BillingPaymentStatus status = BillingPaymentStatus.PENDING;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    private boolean deleted = false;
}
