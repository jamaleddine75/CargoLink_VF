package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.AuditLog;
import com.deliveryplatform.dto.response.AuditLogResponse;
import org.springframework.stereotype.Component;

@Component
public class AuditLogMapper {

    public AuditLogResponse toResponse(AuditLog log) {
        if (log == null) return null;
        
        String actorEmail = "SYSTEM";
        if (log.getActor() != null) {
            try {
                actorEmail = log.getActor().getEmail();
            } catch (jakarta.persistence.EntityNotFoundException | org.hibernate.LazyInitializationException e) {
                actorEmail = "DELETED_USER";
            }
        }

        return AuditLogResponse.builder()
                .id(log.getId() != null ? log.getId().toString() : "")
                .actor(actorEmail)
                .action(log.getAction())
                .target(log.getTarget())
                .ipAddress(log.getIpAddress())
                .timestamp(log.getCreatedAt())
                .build();
    }
}
