package com.deliveryplatform.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReoptimizeRequest {
    @NotEmpty(message = "At least one order ID is required")
    private List<String> orderIds;
}
