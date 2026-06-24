package com.deliveryplatform.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AgencyCustomerRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    private String companyName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Phone is required")
    private String phone;
    
    private String city;
    private String address;
    private String notes;
}
