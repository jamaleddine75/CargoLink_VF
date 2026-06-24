package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.dto.response.AgencyResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AgencyMapper {
    @Mapping(target = "adminAgencyId", source = "adminAgency.id")
    @Mapping(target = "adminAgencyName", source = "adminAgency")
    @Mapping(target = "status", expression = "java(mapStatus(agency))")
    @Mapping(target = "driversCount", expression = "java(agency.getDrivers() != null ? agency.getDrivers().size() : 0)")
    @Mapping(target = "customersCount", expression = "java(agency.getCustomers() != null ? agency.getCustomers().size() : 0)")
    AgencyResponse toResponse(Agency agency);


    default String mapAdminAgencyName(User user) {
        if (user == null) return null;
        return (user.getFirstName() != null ? user.getFirstName() : "") + 
               (user.getLastName() != null ? " " + user.getLastName() : "");
    }

    default String mapStatus(Agency agency) {
        if (agency.getAdminAgency() == null) return "PENDING";
        if (Boolean.FALSE.equals(agency.getAdminAgency().isActive())) return "SUSPENDED";
        return agency.getAdminAgency().getStatus() != null ? agency.getAdminAgency().getStatus().name() : "ACTIVE";
    }
}
