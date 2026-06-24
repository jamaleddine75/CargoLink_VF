package com.deliveryplatform.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignDriverRequest {
    @NotNull(message = "Order ID is required")
    private java.util.UUID orderId;

    @NotNull(message = "Driver ID is required")
    private UUID driverId;
}