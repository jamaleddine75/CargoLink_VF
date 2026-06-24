package com.deliveryplatform.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DisciplinaryActionRequest {
    @NotBlank(message = "Reason is required")
    private String reason;
}
