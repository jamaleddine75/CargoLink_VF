package com.deliveryplatform.dto.request;

import com.deliveryplatform.domain.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class RegisterRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).{8,}$", 
             message = "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character")

    private String password;


    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private String phoneNumber;

    @NotNull(message = "Role is required")
    private Role role;

    // Driver Specific fields
    private String vehicleType;
    private String licenseNumber;
    private String documents;
    @NotBlank(message = "City is required")
    private String city;

    // Client Specific fields
    private String companyName;
    private String taxId;

    @NotBlank(message = "Address is required")
    private String address;

    private Double latitude;
    private Double longitude;

    private String gender;
    private String dateOfBirth;
}
