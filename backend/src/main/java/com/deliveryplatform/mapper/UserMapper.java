package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.Role;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.dto.request.RegisterRequest;
import com.deliveryplatform.dto.response.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.WARN)
public interface UserMapper {
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "companyName", expression = "java(user.getClientProfile() != null ? user.getClientProfile().getCompanyName() : null)")
    @Mapping(target = "billingAddress", expression = "java(user.getClientProfile() != null ? user.getClientProfile().getBillingAddress() : null)")
    @Mapping(target = "taxId", expression = "java(user.getClientProfile() != null ? user.getClientProfile().getTaxId() : null)")
    @Mapping(target = "vehicleInfo", ignore = true)
    @Mapping(target = "vehiclePlate", ignore = true)
    @Mapping(target = "vehicleType", ignore = true)
    @Mapping(target = "licenseNumber", ignore = true)
    @Mapping(target = "agencyId", expression = "java(user.getAgency() != null ? user.getAgency().getId() : null)")
    @Mapping(target = "agencyName", expression = "java(user.getAgency() != null ? user.getAgency().getName() : null)")
    @Mapping(target = "city", expression = "java(user.getAgency() != null ? user.getAgency().getCity() : null)")
    UserResponse toResponse(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "address", ignore = true)
    @Mapping(target = "avatarUrl", ignore = true)
    @Mapping(target = "agency", ignore = true)
    @Mapping(target = "notifications", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    User toEntity(RegisterRequest request);

    default String map(Role role) {
        return role != null ? role.toApiValue() : null;
    }
}
