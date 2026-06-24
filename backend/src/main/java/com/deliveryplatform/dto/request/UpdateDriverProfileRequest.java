package com.deliveryplatform.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDriverProfileRequest {
    @Size(max = 100, message = "First name must be at most 100 characters")
    private String firstName;

    @Size(max = 100, message = "Last name must be at most 100 characters")
    private String lastName;

    @Pattern(
            regexp = "^[0-9+\\-()\\s]{8,20}$",
            message = "Phone number format is invalid"
    )
    private String phoneNumber;

    @Size(max = 20, message = "Vehicle plate must be at most 20 characters")
    private String vehiclePlate;

    @Size(max = 100, message = "License number must be at most 100 characters")
    private String licenseNumber;

    @Size(max = 100, message = "Bank account must be at most 100 characters")
    private String bankAccount;

    @Size(max = 150, message = "Account holder must be at most 150 characters")
    private String bankAccountHolder;

    private String documents;
}
