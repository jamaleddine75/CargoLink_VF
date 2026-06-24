package com.deliveryplatform.controller;

import com.deliveryplatform.domain.entity.PricingConfig;
import com.deliveryplatform.service.PricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingService pricingService;

    @GetMapping("/current")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PricingConfig> getCurrentConfig() {
        return ResponseEntity.ok(pricingService.getCurrentConfig());
    }

    @PostMapping("/update")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PricingConfig> updateConfig(@RequestBody PricingConfig config) {
        return ResponseEntity.ok(pricingService.updateConfig(config));
    }
}
