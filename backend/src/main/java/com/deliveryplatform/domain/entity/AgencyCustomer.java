package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "agency_customers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@org.hibernate.annotations.SQLDelete(sql = "UPDATE agency_customers SET deleted = true WHERE id = ?")
@org.hibernate.annotations.Where(clause = "deleted = false")
public class AgencyCustomer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String fullName;

    private String companyName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    private String city;
    private String address;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AgencyCustomerStatus status = AgencyCustomerStatus.ACTIVE;

    @Builder.Default
    private Integer totalOrders = 0;

    @Builder.Default
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Builder.Default
    private Double successRate = 0.0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @OneToMany(mappedBy = "customer")
    private List<Order> orders;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Builder.Default
    private boolean isVip = false;

    @Builder.Default
    private boolean isHighRisk = false;

    @Builder.Default
    private boolean deleted = false;
}
