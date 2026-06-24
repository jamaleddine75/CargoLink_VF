package com.deliveryplatform.dto.response;

import com.deliveryplatform.domain.entity.AgencyCustomerStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AgencyCustomerResponse {
    private UUID id;
    private String fullName;
    private String companyName;
    private String email;
    private String phone;
    private String city;
    private String address;
    private String notes;
    private AgencyCustomerStatus status;
    private Integer totalOrders;
    private BigDecimal totalRevenue;
    private Double successRate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isVip;
    private boolean isHighRisk;
}
