package com.deliveryplatform.controller;

import com.deliveryplatform.domain.entity.SystemSettings;
import com.deliveryplatform.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public ResponseEntity<SystemSettings> getSettings() {
        return ResponseEntity.ok(settingsService.getSettings());
    }

    @PutMapping
    public ResponseEntity<SystemSettings> updateSettings(@RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(settingsService.updateSettings(updates));
    }
}
