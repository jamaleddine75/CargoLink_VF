package com.deliveryplatform.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class BroadcastRequest {
    @NotBlank
    private String title;
    
    @NotBlank
    private String message;
    
    private List<String> targetRoles; // e.g., ["DRIVER", "AGENCY_ADMIN"]
}
