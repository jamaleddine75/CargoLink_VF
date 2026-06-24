package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.Driver;
import com.deliveryplatform.dto.response.DriverResponse;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper for Driver entity to DTO conversions.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.WARN, builder = @Builder(disableBuilder = true))
public interface DriverMapper {
    @Mapping(target = "id", source = "id")
    @Mapping(target = "firstName", source = "user.firstName")
    @Mapping(target = "lastName", source = "user.lastName")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "avatarUrl", source = "user.avatarUrl")
    @Mapping(target = "phoneNumber", source = "user.phoneNumber")
    @Mapping(target = "vehiclePlate", source = "vehiclePlate")
    @Mapping(target = "vehicleType", source = "vehicleType")
    @Mapping(target = "driverStatus", source = "status")
    @Mapping(target = "agencyId", source = "agency.id")
    @Mapping(target = "agencyName", source = "agency.name")
    @Mapping(target = "agencyCity", source = "agency.city")
    @Mapping(target = "registrationCity", source = "registrationCity")
    @Mapping(target = "verificationStatus", source = "verificationStatus")
    @Mapping(target = "rejectionReason", source = "rejectionReason")
    @Mapping(target = "latitude", source = "latitude")
    @Mapping(target = "longitude", source = "longitude")
    @Mapping(target = "availability", source = "availability")
    @Mapping(target = "disciplinaryStatus", source = "disciplinaryStatus")
    @Mapping(target = "lastDisciplinaryReason", source = "lastDisciplinaryReason")
    @Mapping(target = "rating", source = "rating")
    @Mapping(target = "ratingCount", source = "ratingCount")
    @Mapping(target = "loyaltyPoints", source = "loyaltyPoints")
    @Mapping(target = "licenseNumber", source = "licenseNumber")
    @Mapping(target = "documents", source = "documents")
    @Mapping(target = "bankAccount", source = "bankAccount")
    @Mapping(target = "bankAccountHolder", source = "bankAccountHolder")
    @Mapping(target = "autoAccept", source = "autoAccept")
    @Mapping(target = "notifications", source = "notificationsEnabled")
    @Mapping(target = "sound", source = "soundEnabled")
    @Mapping(target = "googleMaps", source = "googleMapsEnabled")
    @Mapping(target = "darkMap", source = "darkMapEnabled")
    @Mapping(target = "updatedAt", source = "updatedAt")
    DriverResponse toResponse(Driver driver);
}
