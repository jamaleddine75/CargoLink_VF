package com.deliveryplatform.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for reassigning an order from one driver to another.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReassignOrderRequest {

    @NotNull(message = "New driver ID cannot be null")
    private UUID newDriverId;

    @NotBlank(message = "Reassignment reason is required")
    private String reason; // Reason for reassignment (e.g., "Driver unavailable", "Performance issues")

    private String notes; // Optional additional notes
}
