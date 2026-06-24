package com.deliveryplatform.controller;

import com.deliveryplatform.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping("/{orderId}/auto-assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<?> autoAssign(@PathVariable UUID orderId) {
        assignmentService.autoAssignDriver(orderId);
        return ResponseEntity.ok(Map.of("message", "Auto-assignment triggered successfully"));
    }

    @PostMapping("/{orderId}/assign/{driverId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<?> manualAssign(@PathVariable UUID orderId, @PathVariable UUID driverId) {
        assignmentService.manualAssignDriver(orderId, driverId);
        return ResponseEntity.ok(Map.of("message", "Driver assigned successfully"));
    }
}
