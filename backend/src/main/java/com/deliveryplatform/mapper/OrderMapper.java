package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.domain.entity.Driver;
import com.deliveryplatform.dto.request.CreateOrderRequest;
import com.deliveryplatform.dto.response.OrderResponse;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = "spring", 
    unmappedTargetPolicy = ReportingPolicy.WARN,
    builder = @Builder(disableBuilder = true)
)
public interface OrderMapper {

    @Mapping(target = "clientName", source = "client", qualifiedByName = "mapUserToName")
    @Mapping(target = "driverName", source = "driver", qualifiedByName = "mapDriverToName")
    @Mapping(target = "driverPhone", source = "driver.phone")
    @Mapping(target = "driverAvatarUrl", source = "driver.user.avatarUrl")
    @Mapping(target = "driverLat", source = "driver.latitude")
    @Mapping(target = "driverLng", source = "driver.longitude")
    @Mapping(target = "agencyName", source = "agency.name")
    @Mapping(target = "rated", source = "driverRating", qualifiedByName = "hasRating")
    @Mapping(target = "notes", source = "deliveryNotes")
    OrderResponse toResponse(Order orderEntity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "trackingNumber", ignore = true)
    @Mapping(target = "barcode", ignore = true)
    @Mapping(target = "barcodeImagePath", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "client", ignore = true)
    @Mapping(target = "driver", ignore = true)
    @Mapping(target = "agency", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "codCollected", ignore = true)
    @Mapping(target = "pickupDate", ignore = true)
    @Mapping(target = "deliveryStartedDate", ignore = true)
    @Mapping(target = "slaStatus", ignore = true)
    @Mapping(target = "reassignmentCount", ignore = true)
    @Mapping(target = "lastAssignedAt", ignore = true)
    @Mapping(target = "deliveryProofType", ignore = true)
    @Mapping(target = "deliveryProofPhotoUrl", ignore = true)
    @Mapping(target = "deliveryProofPin", ignore = true)
    @Mapping(target = "deliveryNotes", source = "notes")
    @Mapping(target = "paymentStatus", ignore = true)
    @Mapping(target = "paymentConfirmedAt", ignore = true)
    @Mapping(target = "paymentConfirmedBy", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "assignedAt", ignore = true)
    @Mapping(target = "deliveredAt", ignore = true)
    @Mapping(target = "validated", ignore = true)
    @Mapping(target = "validatedAt", ignore = true)
    @Mapping(target = "cashConfirmed", ignore = true)
    @Mapping(target = "cashConfirmedAt", ignore = true)
    @Mapping(target = "cashCollected", ignore = true)
    @Mapping(target = "cashCollectedAt", ignore = true)
    @Mapping(target = "driverRating", ignore = true)
    @Mapping(target = "driverEarnings", ignore = true)
    @Mapping(target = "sequenceIndex", ignore = true)
    @Mapping(target = "currentEta", ignore = true)
    @Mapping(target = "delayAlertSent", ignore = true)
    @Mapping(target = "pointsEarned", ignore = true)
    @Mapping(target = "priority", source = "priority")
    @Mapping(target = "deadline", source = "deadline", dateFormat = "yyyy-MM-dd'T'HH:mm:ss")
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    Order toEntity(CreateOrderRequest request);

    @Named("mapUserToName")
    default String mapUserToName(User user) {
        if (user == null) return null;
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        return (first + " " + last).trim();
    }

    @Named("mapDriverToName")
    default String mapDriverToName(Driver driver) {
        if (driver == null || driver.getUser() == null) return null;
        return mapUserToName(driver.getUser());
    }

    @Named("hasRating")
    default boolean hasRating(Object driverRating) {
        return driverRating != null;
    }
}
