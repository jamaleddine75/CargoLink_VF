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
public class DriverResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String avatarUrl;
    private String phoneNumber;
    private String vehiclePlate;
    private String vehicleType;
    private String driverStatus;
    private UUID agencyId;
    private String agencyName;
    private String agencyCity;
    private String registrationCity;
    private String verificationStatus;
    private String rejectionReason;
    private Double latitude;
    private Double longitude;
    private String availability;
    private String disciplinaryStatus;
    private String lastDisciplinaryReason;
    private java.time.LocalDateTime workPermissionUntil;
    private Double rating;
    private Integer ratingCount;
    private Integer loyaltyPoints;
    
    private String licenseNumber;
    private String documents;
    private String bankAccount;
    private String bankAccountHolder;

    private boolean autoAccept;
    private boolean notifications;
    private boolean sound;
    private boolean googleMaps;
    private boolean darkMap;
    private java.time.LocalDateTime updatedAt;
}