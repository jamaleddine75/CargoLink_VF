package com.deliveryplatform.controller;

import com.deliveryplatform.dto.request.AvatarUpdateRequest;
import com.deliveryplatform.dto.request.UpdateProfileRequest;
import com.deliveryplatform.dto.response.UserResponse;
import com.deliveryplatform.security.UserPrincipal;
import com.deliveryplatform.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getUserProfile(principal.getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        
        return ResponseEntity.ok(userService.updateProfile(principal.getId(), request));
    }

    @PutMapping("/me/avatar")
    public ResponseEntity<UserResponse> updateAvatar(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AvatarUpdateRequest request) {
        
        return ResponseEntity.ok(userService.updateAvatar(principal.getId(), request.getAvatarUrl()));
    }
}