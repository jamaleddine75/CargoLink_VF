package com.deliveryplatform.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "agencies")
@org.hibernate.annotations.Where(clause = "deleted = false")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Agency {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean deleted = false;

    @Column(nullable = false)
    private String name;

    private String address;
    private String contactInfo;

    private String taxId;
    private String logoUrl;
    private String email;
    private String phone;
    private String city;
    private String zipCode;
    private String country;

    private Double latitude;
    private Double longitude;

    @OneToOne
    @JoinColumn(name = "admin_agency_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User adminAgency;


    @Column(columnDefinition = "DECIMAL(5,2) DEFAULT 0.15", name = "commission_rate")
    @Builder.Default
    private BigDecimal commissionRate = new BigDecimal("0.15"); // Commission rate for agency (0.15 = 15%)

    // Metadata & Capacity
    private String code;
    private String sector;
    private String agencyType;
    @Column(columnDefinition = "TEXT")
    private String description;
    private Integer maxDrivers;
    private Integer maxDailyOrders;

    // Operational Settings
    private String openingHour;
    private String closingHour;
    private String workingDays; // Comma separated days
    private BigDecimal managerSalary;
    private BigDecimal managerBonus;
    private Boolean autoDispatch;
    private Integer maxConcurrentDeliveries;
    private Integer maxEmployees;
    @Builder.Default
    private String operationalStatus = "ACTIVE";

    
    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "agency", fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private java.util.List<Driver> drivers = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "agency", fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private java.util.List<AgencyCustomer> customers = new java.util.ArrayList<>();

    @OneToOne(mappedBy = "agency", cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private AgencyWallet wallet;
}
