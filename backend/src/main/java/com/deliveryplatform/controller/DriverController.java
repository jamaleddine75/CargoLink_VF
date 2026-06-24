package com.deliveryplatform.controller;

import com.deliveryplatform.dto.response.DriverResponse;
import com.deliveryplatform.dto.response.DriverDashboardStatsResponse;
import com.deliveryplatform.dto.response.DriverStatsResponse;
import com.deliveryplatform.dto.request.UpdateDriverProfileRequest;
import com.deliveryplatform.service.CloudStorageService;
import com.deliveryplatform.service.DriverService;
import com.deliveryplatform.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('DRIVER', 'ADMIN', 'AGENCY')")
public class DriverController {
    private final DriverService driverService;
    private final CloudStorageService cloudStorageService;

    @GetMapping("/profile")
    public ResponseEntity<DriverResponse> getCurrentDriver(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(driverService.getDriverProfile(principal.getId()));
    }

    @GetMapping("/me")
    public ResponseEntity<DriverResponse> getCurrentDriverAlias(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(driverService.getDriverProfile(principal.getId()));
    }

    @GetMapping("/stats")
    public ResponseEntity<DriverStatsResponse> getDriverStats(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "today") String period) {
        return ResponseEntity.ok(driverService.getDriverStats(principal.getId(), period));
    }

    @GetMapping("/me/stats")
    public ResponseEntity<DriverStatsResponse> getCurrentDriverStatsAlias(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "today") String period) {
        return ResponseEntity.ok(driverService.getDriverStats(principal.getId(), period));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DriverDashboardStatsResponse> getDashboard(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            return ResponseEntity.ok(driverService.getDriverDashboard(principal.getId()));
        } catch (Exception e) {
            return ResponseEntity.ok(DriverDashboardStatsResponse.builder()
                .todayDelivered(0).todayEarnings(java.math.BigDecimal.ZERO)
                .successRate(100.0).isOnline(false).verificationStatus("PENDING").build());
        }
    }

    @GetMapping("/me/dashboard")
    public ResponseEntity<DriverDashboardStatsResponse> getDashboardAlias(
            @AuthenticationPrincipal UserPrincipal principal) {
        return getDashboard(principal);
    }

    @PutMapping("/profile")
    public ResponseEntity<DriverResponse> updateDriverProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateDriverProfileRequest request) {
        return ResponseEntity.ok(driverService.updateDriverProfile(principal.getId(), request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<?> updateDriverStatus(
            @PathVariable UUID id,
            @RequestBody com.deliveryplatform.dto.request.UpdateStatusRequest request) {
        return ResponseEntity.ok(driverService.updateDriverStatus(id, request.getStatus()));
    }

    @PatchMapping("/me/status")
    public ResponseEntity<?> updateCurrentDriverStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody com.deliveryplatform.dto.request.UpdateStatusRequest request) {
        return ResponseEntity.ok(driverService.updateDriverStatus(principal.getId(), request.getStatus()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<List<DriverResponse>> getAllDrivers() {
        return ResponseEntity.ok(driverService.getAllDrivers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DriverResponse> getDriverById(@PathVariable UUID id) {
        return ResponseEntity.ok(driverService.getDriverById(id));
    }

    @PutMapping("/{id}/vehicle")
    public ResponseEntity<DriverResponse> updateVehicleInfo(
            @PathVariable UUID id,
            @RequestParam String vehiclePlate) {
        return ResponseEntity.ok(driverService.updateVehicleInfo(id, vehiclePlate));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<Boolean> isDriverAvailable(@PathVariable UUID id) {
        return ResponseEntity.ok(driverService.isDriverAvailable(id));
    }

    @GetMapping("/preferences")
    public ResponseEntity<DriverResponse> getPreferences(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(driverService.getPreferences(principal.getId()));
    }

    @PatchMapping("/preferences")
    public ResponseEntity<DriverResponse> updatePreferences(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody DriverResponse prefs) {
        return ResponseEntity.ok(driverService.updatePreferences(principal.getId(), prefs));
    }

    @PostMapping("/documents/upload")
    public ResponseEntity<java.util.Map<String, String>> uploadDocument(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "File is required"));
        }
        String url = cloudStorageService.save(file, "driver-documents");

        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("url", url);
        return ResponseEntity.ok(response);
    }
}
