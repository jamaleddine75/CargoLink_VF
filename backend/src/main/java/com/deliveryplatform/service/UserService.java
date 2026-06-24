package com.deliveryplatform.service;

import com.deliveryplatform.dto.request.ChangePasswordRequest;
import com.deliveryplatform.dto.request.UpdateProfileRequest;
import com.deliveryplatform.dto.response.UserResponse;
import java.util.UUID;

public interface UserService {
    UserResponse getUserProfile(UUID userId);
    UserResponse updateProfile(UUID userId, UpdateProfileRequest request);
    void changePassword(UUID userId, ChangePasswordRequest request);
    UserResponse updateAvatar(UUID userId, String avatarUrl);
}