package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.Driver;
import com.deliveryplatform.domain.entity.Incident;
import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.dto.response.IncidentResponse;
import com.deliveryplatform.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

import com.deliveryplatform.repository.UserRepository;

@Component
@RequiredArgsConstructor
public class IncidentMapper {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public IncidentResponse toResponse(Incident incident) {
        if (incident == null) return null;
        Order order = resolveOrder(incident.getOrderId());
        
        String assignedToName = null;
        if (incident.getAssignedTo() != null) {
            assignedToName = userRepository.findById(incident.getAssignedTo())
                .map(u -> (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""))
                .map(String::trim)
                .orElse("Unknown Agent");
        }

        return IncidentResponse.builder()
                .id(incident.getId())
                .orderId(incident.getOrderId())
                .title(incident.getTitle())
                .description(incident.getDescription())
                .category(incident.getCategory())
                .type(incident.getCategory())
                .status(incident.getStatus())
                .resolution(incident.getResolution())
                .priority(incident.getPriority() != null ? incident.getPriority() : "MEDIUM")
                .assignedTo(incident.getAssignedTo())
                .assignedToName(assignedToName)
                .notes(incident.getNotes())
                .attachments(incident.getAttachments())
                .source(incident.getSource())
                .clientId(incident.getClientId())
                .orderTrackingNumber(order != null ? order.getTrackingNumber() : null)
                .driverName(resolveDriverName(order))
                .driverId(order != null && order.getDriver() != null ? order.getDriver().getId() != null ? order.getDriver().getId().toString() : null : null)
                .createdAt(incident.getCreatedAt())
                .updatedAt(incident.getUpdatedAt())
                .build();
    }

    private Order resolveOrder(java.util.UUID orderId) {
        if (orderId == null) {
            return null;
        }
        return orderRepository.findById(orderId).orElse(null);
    }

    private String resolveDriverName(Order order) {
        if (order == null || order.getDriver() == null) {
            return null;
        }

        Driver driver = order.getDriver();
        if (driver.getUser() != null) {
            String firstName = Optional.ofNullable(driver.getUser().getFirstName()).orElse("");
            String lastName = Optional.ofNullable(driver.getUser().getLastName()).orElse("");
            String fullName = (firstName + " " + lastName).trim();
            if (!fullName.isBlank()) {
                return fullName;
            }
        }

        if (driver.getName() != null && !driver.getName().isBlank()) {
            return driver.getName();
        }

        return null;
    }
}
