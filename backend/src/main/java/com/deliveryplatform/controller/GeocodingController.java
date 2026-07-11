package com.deliveryplatform.controller;

import com.deliveryplatform.dto.request.GeocodingRequest;
import com.deliveryplatform.dto.response.GeocodingResponse;
import com.deliveryplatform.service.GeocodingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/geocoding")
@RequiredArgsConstructor
@Validated
public class GeocodingController {

    private final GeocodingService geocodingService;

    @PostMapping("/reverse")
    public ResponseEntity<GeocodingResponse> reverseGeocode(@RequestBody @Validated GeocodingRequest request) {
        GeocodingResponse response = geocodingService.reverseGeocode(request.getLatitude(), request.getLongitude());
        return ResponseEntity.ok(response);
    }
}
