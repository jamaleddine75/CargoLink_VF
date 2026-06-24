package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgencyResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String taxId;
    private String logoUrl;
    private String city;
    private String zipCode;
    private String country;
    private String status;
    private UUID adminAgencyId;
    private String adminAgencyName;
    private BigDecimal commissionRate;
    private Integer driversCount;
    private Integer customersCount;


    // Metadata & Capacity
    private String code;
    private String sector;
    private String agencyType;
    private String description;
    private Integer maxDrivers;
    private Integer maxDailyOrders;

    // Operational Settings
    private String openingHour;
    private String closingHour;
    private String workingDays;
    private BigDecimal managerSalary;
    private BigDecimal managerBonus;
    private Boolean autoDispatch;
    private Integer maxConcurrentDeliveries;
    private Integer maxEmployees;
    private String operationalStatus;
    private String notes;
}

