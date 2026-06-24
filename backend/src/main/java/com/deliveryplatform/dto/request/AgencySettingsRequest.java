package com.deliveryplatform.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgencySettingsRequest {
    private String name;
    private String email;
    private String phone;
    private String address;
    private String taxId;
    private String logoUrl;
    private String city;
    private String zipCode;
    private String country;
}
