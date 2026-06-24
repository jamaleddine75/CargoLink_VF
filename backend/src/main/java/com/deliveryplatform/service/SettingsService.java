package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.SystemSettings;
import com.deliveryplatform.repository.SystemSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final SystemSettingsRepository settingsRepository;

    @Transactional(readOnly = true)
    public SystemSettings getSettings() {
        return settingsRepository.findFirstByOrderById()
                .orElseGet(() -> settingsRepository.save(SystemSettings.builder()
                        .platformName("Cargologic")
                        .currency("MAD")
                        .timezone("UTC+1")
                        .jwtExpiry(86400000L)
                        .build()));
    }

    @Transactional
    public SystemSettings updateSettings(Map<String, Object> updates) {
        SystemSettings settings = getSettings();
        if (updates.containsKey("platformName")) settings.setPlatformName((String) updates.get("platformName"));
        if (updates.containsKey("currency")) settings.setCurrency((String) updates.get("currency"));
        if (updates.containsKey("timezone")) settings.setTimezone((String) updates.get("timezone"));
        if (updates.containsKey("maintenanceMode")) settings.setMaintenanceMode((Boolean) updates.get("maintenanceMode"));
        if (updates.containsKey("jwtExpiry")) settings.setJwtExpiry(Long.valueOf(updates.get("jwtExpiry").toString()));
        return settingsRepository.save(settings);
    }
}
