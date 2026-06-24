package com.deliveryplatform.domain.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Role {
    ADMIN,
    AGENCY_ADMIN,
    AGENCY,  // Alias for AGENCY_ADMIN for database compatibility
    DRIVER,
    CUSTOMER;

    @JsonCreator
    public static Role fromString(String value) {
        if (value == null || value.isBlank()) return null;
        String upper = value.toUpperCase();
        
        // Aliases & Normalization
        if ("SUPER_ADMIN".equals(upper)) return ADMIN;
        if ("AGENCY".equals(upper) || "AGENCY_ADMIN".equals(upper)) return AGENCY_ADMIN;
        if ("LIVREUR".equals(upper) || "DRIVER".equals(upper)) return DRIVER;
        if ("CLIENT".equals(upper) || "CUSTOMER".equals(upper)) return CUSTOMER;
        
        try {
            return Role.valueOf(upper);
        } catch (IllegalArgumentException e) {
            return null; // Return null instead of throwing to avoid breaking business logic
        }
    }

    public String toAuthorityName() {
        if (this == AGENCY_ADMIN || this == AGENCY) {
            return "ROLE_AGENCY";
        }
        if (this == CUSTOMER) {
            return "ROLE_CLIENT";
        }
        return "ROLE_" + name();
    }

    @JsonValue
    public String toApiValue() {
        // Always return the canonical form for API responses
        if (this == AGENCY_ADMIN || this == AGENCY) {
            return "AGENCY";
        }
        return name();
    }
    
    public boolean isAgencyRole() {
        return this == AGENCY_ADMIN || this == AGENCY;
    }
}
