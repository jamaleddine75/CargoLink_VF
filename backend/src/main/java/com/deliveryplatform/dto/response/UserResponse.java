package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String role;
    private boolean isActive;
    private String status;
    private String address;
    private String avatarUrl;
    private String companyName;
    private String billingAddress;
    private String taxId;
    private String vehicleInfo;
    private String vehiclePlate;
    private String vehicleType;
    private String licenseNumber;
    private UUID agencyId;
    private String agencyName;
}
