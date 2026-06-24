package com.deliveryplatform.controller;

import com.deliveryplatform.domain.entity.TrackingHistory;
import com.deliveryplatform.service.TrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingService trackingService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<Void> updatePosition(
            @PathVariable java.util.UUID orderId,
            @RequestBody Map<String, Double> payload) {
        Double lat = payload.get("lat");
        Double lng = payload.get("lng");
        if (lat != null && lng != null) {
            trackingService.saveCoordinates(orderId, lat, lng);
            
            // Broadcast real-time update
            Map<String, Object> update = Map.of(
                "orderId", orderId.toString(),
                "driverLat", lat,
                "driverLng", lng,
                "timestamp", LocalDateTime.now().toString()
            );
            messagingTemplate.convertAndSend("/topic/tracking/" + orderId, update);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/driver/{driverId}/position")
    @PreAuthorize("hasAnyRole('DRIVER', 'ADMIN')")
    public ResponseEntity<Void> updateDriverPosition(
            @PathVariable java.util.UUID driverId,
            @RequestBody Map<String, Double> payload) {
        Double lat = payload.get("lat");
        Double lng = payload.get("lng");
        
        if (lat != null && lng != null) {
            // 1. Update cascade ETAs
            trackingService.saveDriverPosition(driverId, lat, lng);
            
            // 2. Broadcast driver live position
            Map<String, Object> update = Map.of(
                "driverId", driverId,
                "lat", lat,
                "lng", lng,
                "timestamp", LocalDateTime.now().toString()
            );
            messagingTemplate.convertAndSend("/topic/tracking/driver/" + driverId, update);
        }
        
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<List<TrackingHistory>> getHistory(@PathVariable java.util.UUID orderId) {
        return ResponseEntity.ok(trackingService.getOrderHistory(orderId));
    }
}