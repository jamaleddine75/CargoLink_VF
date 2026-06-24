package com.deliveryplatform.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgencyUpdateRequest {
    
    private ManagerInfo manager;
    private AgencyInfo agency;
    private LocationInfo location;
    private OperationsInfo operations;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManagerInfo {
        private String fullName;
        private String email;
        private String phone;
        private String password;
        private String currentPassword;
    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgencyInfo {
        private String name;
        private String code;
        private String city;
        private String sector;
        private String address;
        private String description;
        private Integer maxDrivers;
        private Integer maxDailyOrders;
        private String logoUrl;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationInfo {
        private Double lat;
        private Double lng;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperationsInfo {
        private String openingHour;
        private String closingHour;
        private String workingDays;
        private BigDecimal salary;
        private BigDecimal commissionRate;
        private BigDecimal bonus;
        private Boolean autoDispatch;
        private Integer maxConcurrentDeliveries;
        private Integer maxEmployees;
        private String operationalStatus;
    }
}
