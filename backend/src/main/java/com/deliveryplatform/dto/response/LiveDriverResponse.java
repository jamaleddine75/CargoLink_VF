package com.deliveryplatform.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LiveDriverResponse {
    private Long id;
    private String name;
    private String phone;
    private String status;
    private Double latitude;
    private Double longitude;
}
