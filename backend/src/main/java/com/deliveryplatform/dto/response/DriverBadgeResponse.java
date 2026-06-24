package com.deliveryplatform.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DriverBadgeResponse {
    private String id;
    private String name;
    private String description;
    private String icon;
    private String earnedAt;
    private String type; // GOLD | SILVER | BRONZE
}
