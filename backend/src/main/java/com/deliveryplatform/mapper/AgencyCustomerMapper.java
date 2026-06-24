package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.AgencyCustomer;
import com.deliveryplatform.dto.request.AgencyCustomerRequest;
import com.deliveryplatform.dto.response.AgencyCustomerResponse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class AgencyCustomerMapper {

    public AgencyCustomer toEntity(AgencyCustomerRequest request) {
        return AgencyCustomer.builder()
                .fullName(request.getFullName())
                .companyName(request.getCompanyName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .city(request.getCity())
                .address(request.getAddress())
                .notes(request.getNotes())
                .build();
    }

    public void updateEntity(AgencyCustomer entity, AgencyCustomerRequest request) {
        entity.setFullName(request.getFullName());
        entity.setCompanyName(request.getCompanyName());
        entity.setEmail(request.getEmail());
        entity.setPhone(request.getPhone());
        entity.setCity(request.getCity());
        entity.setAddress(request.getAddress());
        entity.setNotes(request.getNotes());
    }

    public AgencyCustomerResponse toResponse(AgencyCustomer entity) {
        // VIP logic: totalRevenue > 5000 or totalOrders > 50
        boolean isVip = entity.getTotalRevenue().compareTo(new BigDecimal("5000")) > 0 || entity.getTotalOrders() > 50;
        
        // High Risk logic: successRate < 0.7 and totalOrders > 5
        boolean isHighRisk = entity.getTotalOrders() > 5 && entity.getSuccessRate() < 0.7;

        return AgencyCustomerResponse.builder()
                .id(entity.getId())
                .fullName(entity.getFullName())
                .companyName(entity.getCompanyName())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .city(entity.getCity())
                .address(entity.getAddress())
                .notes(entity.getNotes())
                .status(entity.getStatus())
                .totalOrders(entity.getTotalOrders())
                .totalRevenue(entity.getTotalRevenue())
                .successRate(entity.getSuccessRate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .isVip(isVip)
                .isHighRisk(isHighRisk)
                .build();
    }
}
