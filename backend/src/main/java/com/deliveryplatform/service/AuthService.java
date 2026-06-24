package com.deliveryplatform.service;

import com.deliveryplatform.dto.request.LoginRequest;
import com.deliveryplatform.dto.request.RegisterRequest;
import com.deliveryplatform.dto.response.JwtAuthResponse;

import java.util.Map;
import java.util.Optional;

public interface AuthService {
    JwtAuthResponse login(LoginRequest loginRequest);
    JwtAuthResponse register(RegisterRequest registerRequest);
    void registerDriverForAgency(RegisterRequest registerRequest, com.deliveryplatform.domain.entity.User createdBy);
    /** Returns account status info if the email exists, empty Optional otherwise. */
    Optional<Map<String, Object>> getAccountStatus(String email);
}