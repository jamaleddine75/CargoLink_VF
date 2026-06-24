package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.dto.request.ChangePasswordRequest;
import com.deliveryplatform.dto.request.UpdateProfileRequest;
import com.deliveryplatform.dto.response.UserResponse;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.mapper.UserMapper;
import com.deliveryplatform.repository.ClientProfileRepository;
import com.deliveryplatform.repository.DriverRepository;
import com.deliveryplatform.repository.UserRepository;
import com.deliveryplatform.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserProfile(UUID userId) {
        log.debug("Fetching profile for user: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User profile lookup failed: User with ID {} not found", userId);
                    return new ResourceNotFoundException("User", "id", userId);
                });
        
        try {
            log.debug("Found user: {}. Mapping to response...", user.getEmail());
            UserResponse response = enrichUserResponse(user);
            log.debug("Successfully mapped user {} to response.", user.getEmail());
            return response;
        } catch (Exception e) {
            log.error("Failed to map user profile for {}: {}", user.getEmail(), e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setAddress(request.getAddress());
        
        User saved = userRepository.save(user);
        log.info("Profile updated for user: {}", userId);
        return enrichUserResponse(saved);
    }

    @Override
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid old password");
        }
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for user: {}", userId);
    }

    @Override
    public UserResponse updateAvatar(UUID userId, String avatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        user.setAvatarUrl(avatarUrl);
        User saved = userRepository.save(user);
        log.info("Avatar updated for user: {}", userId);
        return enrichUserResponse(saved);
    }

    private UserResponse enrichUserResponse(User user) {

        if (user == null) return null;
        
        UserResponse response = userMapper.toResponse(user);
        if (response == null) {
            log.warn("UserMapper returned null response for user: {}", user.getEmail());
            return null;
        }
        
        // Enrich with driver details if available
        try {
            driverRepository.findByUserId(user.getId()).ifPresent(driver -> {
                response.setVehiclePlate(driver.getVehiclePlate());
                response.setVehicleType(driver.getVehicleType() != null ? driver.getVehicleType().name() : null);
                response.setLicenseNumber(driver.getLicenseNumber());
                if (driver.getVehicleType() != null && driver.getVehiclePlate() != null) {
                    response.setVehicleInfo(driver.getVehicleType() + " [" + driver.getVehiclePlate() + "]");
                }
            });
        } catch (Exception e) {
            log.warn("Error enriching user profile with driver details: {}", e.getMessage());
        }
        
        // Enrich with client details if available
        try {
            clientProfileRepository.findByUserId(user.getId()).ifPresent(client -> {
                response.setCompanyName(client.getCompanyName());
                response.setBillingAddress(client.getBillingAddress());
                response.setTaxId(client.getTaxId());
            });
        } catch (Exception e) {
            log.warn("Error enriching user profile with client details: {}", e.getMessage());
        }
        
        return response;
    }

}