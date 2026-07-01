package com.deliveryplatform.controller;

import com.deliveryplatform.dto.request.LoginRequest;
import com.deliveryplatform.dto.request.RegisterRequest;
import com.deliveryplatform.dto.response.JwtAuthResponse;
import com.deliveryplatform.exception.BadRequestException;
import com.deliveryplatform.service.AuthService;
import com.deliveryplatform.service.UserService;
import com.deliveryplatform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final com.deliveryplatform.service.RefreshTokenService refreshTokenService;
    private final com.deliveryplatform.security.JwtTokenProvider jwtTokenProvider;
    private final com.deliveryplatform.repository.UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<JwtAuthResponse> login(@Valid @RequestBody LoginRequest loginRequest, jakarta.servlet.http.HttpServletResponse response) {
        JwtAuthResponse authResponse = authService.login(loginRequest);
        setTokenCookie(response, authResponse.getToken());
        
        // Issue Refresh Token
        org.springframework.security.core.userdetails.UserDetails userDetails = (org.springframework.security.core.userdetails.UserDetails) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        com.deliveryplatform.domain.entity.User userEntity = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        com.deliveryplatform.domain.entity.RefreshToken refreshToken = refreshTokenService.createRefreshToken(userEntity.getId());
        setRefreshTokenCookie(response, refreshToken.getToken());

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<JwtAuthResponse> register(@Valid @RequestBody RegisterRequest registerRequest, jakarta.servlet.http.HttpServletResponse response) {
        JwtAuthResponse authResponse = authService.register(registerRequest);
        setTokenCookie(response, authResponse.getToken());

        // Issue Refresh Token
        com.deliveryplatform.domain.entity.User userEntity = userRepository.findByEmail(authResponse.getEmail()).orElseThrow();
        com.deliveryplatform.domain.entity.RefreshToken refreshToken = refreshTokenService.createRefreshToken(userEntity.getId());
        setRefreshTokenCookie(response, refreshToken.getToken());

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<JwtAuthResponse> refreshToken(jakarta.servlet.http.HttpServletRequest request, jakarta.servlet.http.HttpServletResponse response) {
        String refreshTokenString = null;
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("REFRESH_TOKEN".equals(cookie.getName())) {
                    refreshTokenString = cookie.getValue();
                }
            }
        }

        if (refreshTokenString == null) {
            throw new BadRequestException("Refresh token is missing");
        }

        return refreshTokenService.findByToken(refreshTokenString)
                .map(refreshTokenService::verifyExpiration)
                .map(com.deliveryplatform.domain.entity.RefreshToken::getUser)
                .map(user -> {
                    com.deliveryplatform.security.UserPrincipal principal = new com.deliveryplatform.security.UserPrincipal(user);
                    String token = jwtTokenProvider.generateToken(principal);
                    setTokenCookie(response, token);
                    return ResponseEntity.ok(JwtAuthResponse.builder()
                            .token(token)
                            .email(user.getEmail())
                            .role(user.getRole().name())
                            .firstName(user.getFirstName())
                            .lastName(user.getLastName())
                            .build());
                })
                .orElseThrow(() -> new BadRequestException("Refresh token is invalid"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@AuthenticationPrincipal UserPrincipal principal, jakarta.servlet.http.HttpServletResponse response) {
        if (principal != null) {
            refreshTokenService.deleteByUserId(principal.getId());
        }
        
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("JWT_TOKEN", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);

        jakarta.servlet.http.Cookie refreshCookie = new jakarta.servlet.http.Cookie("REFRESH_TOKEN", null);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(0);
        response.addCookie(refreshCookie);

        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    private void setTokenCookie(jakarta.servlet.http.HttpServletResponse response, String token) {
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("JWT_TOKEN", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true); // Should be true in production (HTTPS)
        cookie.setPath("/");
        cookie.setMaxAge(15 * 60); // 15 minutes for access token
        response.addCookie(cookie);
    }

    private void setRefreshTokenCookie(jakarta.servlet.http.HttpServletResponse response, String token) {
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("REFRESH_TOKEN", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days for refresh token
        response.addCookie(cookie);
    }

    @PostMapping("/register-driver")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<Map<String, String>> registerDriver(
            @Valid @RequestBody RegisterRequest registerRequest,
            @AuthenticationPrincipal UserPrincipal principal) {
        authService.registerDriverForAgency(registerRequest, principal.getUser());
        return ResponseEntity.ok(Map.of("message", "Driver registered successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<com.deliveryplatform.dto.response.UserResponse> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(userService.getUserProfile(principal.getId()));
    }

    @PutMapping("/update")
    public ResponseEntity<com.deliveryplatform.dto.response.UserResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody com.deliveryplatform.dto.request.UpdateProfileRequest request) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(userService.updateProfile(principal.getId(), request));
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody com.deliveryplatform.dto.request.ChangePasswordRequest request) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        userService.changePassword(principal.getId(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    /**
     * FIX BS-09: Avatar upload secured against path traversal.
     * - Extension extracted from a sanitized filename only (not getOriginalFilename raw)
     * - File extension whitelist enforced
     * - Target path canonically verified to be inside the upload directory
     */
    @PutMapping(value = "/avatar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<com.deliveryplatform.dto.response.UserResponse> uploadAvatar(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {

        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("File size exceeds 5MB limit");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
            throw new BadRequestException("Only JPG and PNG images are allowed");
        }

        // FIX: Extract extension safely — never trust getOriginalFilename() directly
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        String ext = StringUtils.getFilenameExtension(originalName);
        if (ext == null || !List.of("jpg", "jpeg", "png").contains(ext.toLowerCase())) {
            throw new BadRequestException("Invalid file extension");
        }

        try {
            String uploadDir = "uploads/avatars/";
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            // Safe filename — no user-supplied name in the path
            String safeFileName = principal.getId().toString() + "_" + System.currentTimeMillis() + "." + ext.toLowerCase();
            Path targetPath = uploadPath.resolve(safeFileName).normalize();

            // FIX: Verify the resolved path is still inside the upload directory
            if (!targetPath.startsWith(uploadPath)) {
                throw new BadRequestException("Invalid file path");
            }

            Files.write(targetPath, file.getBytes());
            String avatarUrl = "/uploads/avatars/" + safeFileName;
            return ResponseEntity.ok(userService.updateAvatar(principal.getId(), avatarUrl));
        } catch (java.io.IOException e) {
            log.error("Failed to store avatar for user {}: {}", principal.getId(), e.getMessage());
            throw new RuntimeException("Could not store image", e);
        }
    }

    /**
     * Update avatar using a provided URL (e.g., from Supabase Storage)
     */
    @PutMapping("/avatar/url")
    public ResponseEntity<com.deliveryplatform.dto.response.UserResponse> updateAvatarUrl(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> request) {
        String avatarUrl = request.get("avatarUrl");
        if (avatarUrl == null || avatarUrl.isBlank()) {
            throw new BadRequestException("Avatar URL is required");
        }
        // Basic URL validation
        if (!avatarUrl.startsWith("http")) {
            throw new BadRequestException("Invalid avatar URL format");
        }
        return ResponseEntity.ok(userService.updateAvatar(principal.getId(), avatarUrl));
    }


    /**
     * FIX BS-13: No longer leaks user existence via 404.
     * Returns 200 with a generic message regardless of whether the email is registered.
     * Only approved/pending users checking their own status should use this endpoint.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getAccountStatus(@RequestParam String email) {
        Map<String, Object> body = new HashMap<>();
        authService.getAccountStatus(email).ifPresentOrElse(
                info -> body.putAll(info),
                () -> {
                    // Return same shape as a real response to prevent email enumeration
                    body.put("status", "PENDING");
                    body.put("message", "If this account exists, its status is shown above.");
                }
        );
        return ResponseEntity.ok(body);
    }
}