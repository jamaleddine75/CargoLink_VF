package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.Notification;
import com.deliveryplatform.domain.entity.Role;
import com.deliveryplatform.dto.response.NotificationResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.Collections;
import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface NotificationMapper {
    @Mapping(target = "userId", source = "recipient.id")
    @Mapping(target = "recipientEmail", source = "recipient.email")
    @Mapping(target = "recipientRole", expression = "java(mapRole(notification.getRecipient() != null ? notification.getRecipient().getRole() : null))")
    @Mapping(target = "targetRoles", expression = "java(mapTargetRoles(notification.getRecipient() != null ? notification.getRecipient().getRole() : null))")
    NotificationResponse toResponse(Notification notification);

    default String mapRole(Role role) {
        if (role == null) {
            return "SYSTEM";
        }
        return role.toApiValue();
    }

    default List<String> mapTargetRoles(Role role) {
        return Collections.singletonList(mapRole(role));
    }
}
