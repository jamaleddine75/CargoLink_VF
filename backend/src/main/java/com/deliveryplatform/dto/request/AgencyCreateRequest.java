package com.deliveryplatform.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgencyCreateRequest {

    // ── Nested payload from frontend wizard ──

    private ManagerInfo manager;
    private AgencyInfo agency;
    private LocationInfo location;
    private OperationsInfo operations;

    // ── Legacy flat fields (backward-compatible) ──
    private String companyName;
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phoneNumber;
    private String avatarUrl;
    private String city;
    private Double latitude;
    private Double longitude;

    // ── Helper methods: resolve nested-or-flat ──

    public String resolveEmail() {
        if (manager != null && manager.getEmail() != null) return manager.getEmail();
        return email;
    }

    public String resolvePassword() {
        if (manager != null && manager.getPassword() != null) return manager.getPassword();
        return password;
    }

    public String resolvePhone() {
        if (manager != null && manager.getPhone() != null) return manager.getPhone();
        return phoneNumber;
    }

    public String resolveFullName() {
        if (manager != null && manager.getFullName() != null) return manager.getFullName();
        String fn = firstName != null ? firstName : "";
        String ln = lastName != null ? lastName : "";
        return (fn + " " + ln).trim();
    }

    public String resolveFirstName() {
        if (manager != null && manager.getFullName() != null) {
            String[] parts = manager.getFullName().split("\\s+", 2);
            return parts[0];
        }
        return firstName;
    }

    public String resolveLastName() {
        if (manager != null && manager.getFullName() != null) {
            String[] parts = manager.getFullName().split("\\s+", 2);
            return parts.length > 1 ? parts[1] : "";
        }
        return lastName;
    }

    public String resolveAgencyName() {
        if (agency != null && agency.getName() != null) return agency.getName();
        if (companyName != null) return companyName;
        return "Agency " + resolveLastName();
    }

    public String resolveCity() {
        if (agency != null && agency.getCity() != null) return agency.getCity();
        return city;
    }

    public Double resolveLatitude() {
        if (location != null && location.getLat() != null) return location.getLat();
        return latitude;
    }

    public Double resolveLongitude() {
        if (location != null && location.getLng() != null) return location.getLng();
        return longitude;
    }

    // ── Inner classes for nested structure ──

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManagerInfo {
        private String fullName;
        private String email;
        private String phone;
        private String password;
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
        private Double salary;
        private Double commissionRate;
        private Double bonus;
        private Boolean autoDispatch;
        private Integer maxEmployees;
        private Integer maxConcurrentDeliveries;
        private String operationalStatus;
    }

}
