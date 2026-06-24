package com.deliveryplatform.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AvatarUpdateRequest {
    @NotBlank(message = "Avatar URL is required")
    private String avatarUrl;
}
