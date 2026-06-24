package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JwtAuthResponse {
    private String token;
    @Default
    private String tokenType = "Bearer";
    private String email;
    private String role;
    private String firstName;
    private String lastName;
    private String message;
}