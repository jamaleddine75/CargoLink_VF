package com.deliveryplatform.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Request DTO for bulk assigning multiple orders to multiple drivers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchAssignRequest {

    @NotEmpty(message = "Order IDs list cannot be empty")
    private List<java.util.UUID> orderIds;

    @NotNull(message = "Driver ID cannot be null")
    private UUID driverId;

    private String assignmentReason; // Optional: reason for assignment
}
