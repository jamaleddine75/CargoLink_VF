package com.deliveryplatform.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedAddressRequest {
    @NotBlank(message = "Label is required")
    private String label;
    
    @NotBlank(message = "Address is required")
    private String address;
    
    @NotBlank(message = "City is required")
    private String city;
    
    private Double lat;
    private Double lng;
    
    private String contactName;
    private String contactPhone;
}
