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
public class SavedAddressResponse {
    private UUID id;
    private String label;
    private String address;
    private String city;
    private Double lat;
    private Double lng;
    private String contactName;
    private String contactPhone;
}
