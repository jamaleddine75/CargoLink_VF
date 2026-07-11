package com.deliveryplatform.controller;

import com.deliveryplatform.dto.request.CreateOrderRequest;
import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.dto.response.PagedResponse;
import com.deliveryplatform.service.OrderService;
import com.deliveryplatform.dto.response.DriverStatsResponse;
import com.deliveryplatform.dto.response.ClientKPIsResponse;
import com.deliveryplatform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {
    private final OrderService orderService;
    private final com.deliveryplatform.service.PricingService pricingService;

    // ── Order Listing ──────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<PagedResponse<OrderResponse>> getOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID driverId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {

        if (principal == null || principal.getId() == null) {
            return ResponseEntity.status(401).build();
        }

        boolean isClient = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CLIENT"));

        if (isClient) {
            return ResponseEntity.ok(orderService.getClientOrders(principal.getId(), status, page, size));
        }

        String role = principal.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(orderService.getOrders(driverId, principal.getId(), role, status, page, size));
    }

    @GetMapping("/client/my")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<PagedResponse<OrderResponse>> getMyOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {

        if (principal == null || principal.getId() == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(orderService.getClientOrders(principal.getId(), status, page, size));
    }

    // ── KPI Endpoints ──────────────────────────────────────────────────────────

    @GetMapping("/driver-kpis/{driverId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<DriverStatsResponse> getDriverKPIs(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID driverId) {
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        // Non-admins can only query their own stats
        java.util.UUID targetId = (isAdmin) ? driverId : principal.getId();
        return ResponseEntity.ok(orderService.getDriverStats(targetId));
    }

    /**
     * FIX BS-08: Added ownership check — customers can only query their own KPIs.
     */
    @GetMapping("/client-kpis/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")
    public ResponseEntity<ClientKPIsResponse> getClientKPIs(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID clientId) {
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !principal.getId().equals(clientId)) {
            log.warn("IDOR attempt: user {} tried to access KPIs of client {}", principal.getId(), clientId);
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(orderService.getClientKPIs(clientId));
    }

    // ── Single Order ───────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        String role = principal != null ? principal.getAuthorities().iterator().next().getAuthority() : "ROLE_USER";
        return ResponseEntity.ok(orderService.getOrderById(id, principal != null ? principal.getId() : null, role));
    }

    @GetMapping("/find-by-tracking/{trackingNumber}")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<OrderResponse> getOrderByTrackingNumber(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String trackingNumber) {
        return ResponseEntity.ok(orderService.findByTrackingNumberForDriver(trackingNumber, principal.getId()));
    }

    // ── Status Updates (AUTHENTICATED) ─────────────────────────────────────────

    /**
     * FIX BS-02: Moved from /public/status/{id} (unauthenticated) to
     * /driver/status/{id} requiring DRIVER or ADMIN role.
     */
    @PutMapping("/driver/status/{id}")
    @PreAuthorize("hasAnyRole('DRIVER', 'ADMIN')")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> payload) {
        log.debug("updateOrderStatus called by user {} for order {}", principal.getId(), id);
        String status = (String) payload.get("status");
        Double lat = payload.get("lat") != null ? ((Number) payload.get("lat")).doubleValue() : null;
        Double lng = payload.get("lng") != null ? ((Number) payload.get("lng")).doubleValue() : null;
        String photoUrl = (String) payload.get("photoUrl");
        String scanValue = (String) payload.get("scanValue");
        String comment = (String) payload.get("comment");
        Object codCollectedObj = payload.get("codCollected");
        Boolean codCollected = null;
        if (codCollectedObj instanceof Boolean b) {
            codCollected = b;
        } else if (codCollectedObj instanceof String s) {
            codCollected = Boolean.parseBoolean(s);
        }
        return ResponseEntity.ok(orderService.updateOrderStatus(id, principal.getId(), status, lat, lng, photoUrl, scanValue, comment, codCollected));
    }

    // ── Driver Actions ─────────────────────────────────────────────────────────

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<OrderResponse> acceptOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(orderService.acceptOrder(id, principal.getId()));
    }

    /**
     * FIX BS-10: Replaced @PreAuthorize("permitAll()") with proper role check.
     */
    @PostMapping("/{id}/refuse")
    @PreAuthorize("hasAnyRole('DRIVER', 'ADMIN')")
    public ResponseEntity<OrderResponse> refuseOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        log.debug("refuseOrder called by user {} for order {}", principal.getId(), id);
        return ResponseEntity.ok(orderService.refuseOrder(id, principal.getId()));
    }

    @PostMapping("/{id}/problem")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<OrderResponse> reportProblem(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        String category = payload.get("category");
        String description = payload.get("description");
        return ResponseEntity.ok(orderService.reportProblem(id, category, description));
    }

    @GetMapping("/{id}/tracking")
    public ResponseEntity<List<?>> getOrderTracking(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrderTracking(id));
    }

    @PostMapping("/{id}/rate")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Map<String, String>> rateDriver(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> payload) {
        Integer rating = (Integer) payload.get("rating");
        String comment = (String) payload.get("comment");
        orderService.rateDriver(id, principal.getId(), rating, comment);
        return ResponseEntity.ok(Map.of("message", "Rating submitted successfully"));
    }

    // ── Batch Operations ───────────────────────────────────────────────────────

    @PostMapping("/batch-status")
    @PreAuthorize("hasAnyRole('DRIVER', 'ADMIN')")
    public ResponseEntity<List<OrderResponse>> batchUpdateOrderStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> payload) {
        Object trackingNumbersObj = payload.get("trackingNumbers");
        List<String> trackingNumbers = null;
        if (trackingNumbersObj instanceof List<?>) {
            trackingNumbers = ((List<?>) trackingNumbersObj).stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .toList();
        }
        String status = (String) payload.get("status");
        Double lat = payload.get("lat") != null ? ((Number) payload.get("lat")).doubleValue() : null;
        Double lng = payload.get("lng") != null ? ((Number) payload.get("lng")).doubleValue() : null;
        String comment = (String) payload.get("comment");
        return ResponseEntity.ok(orderService.batchUpdateOrderStatus(trackingNumbers, status, lat, lng, comment, principal.getId()));
    }

    // ── Driver-Specific Queries ────────────────────────────────────────────────
 
    @GetMapping("/driver/active")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<List<OrderResponse>> getActiveOrder(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(orderService.getActiveOrder(principal.getId()));
    }
 
    @GetMapping("/driver/available")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<PagedResponse<OrderResponse>> getAvailableOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return ResponseEntity.ok(orderService.getAvailableOrders(principal.getId(), page, size));
    }
 
    @GetMapping("/driver/history")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<PagedResponse<OrderResponse>> getDriverHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return ResponseEntity.ok(orderService.getDriverHistory(principal.getId(), status, startDate, endDate, page, size));
    }
 
    @GetMapping("/driver/stats")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<Map<String, Object>> getDriverDashboardStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(orderService.getDriverDashboardStats(principal.getId()));
    }
 
    @PostMapping("/{id}/assign-driver")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<OrderResponse> assignOrderToDriver(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(orderService.assignOrderToDriver(id, principal.getId()));
    }
 
    // ── Order Creation ─────────────────────────────────────────────────────────
 
    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<OrderResponse> createOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateOrderRequest request) {
        if (principal == null || principal.getId() == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(orderService.createOrder(request, principal.getId()));
    }

    @PostMapping("/proof-of-delivery")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<OrderResponse> submitProofOfDelivery(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID orderId,
            @RequestParam String proofMethod,
            @RequestParam(required = false) String pinCode,
            @RequestParam(required = false) MultipartFile photo,
            @RequestParam(required = false) String notes) throws Exception {
        try {
            return ResponseEntity.ok(orderService.submitProofOfDelivery(orderId, principal.getId(), proofMethod, pinCode, photo, notes));
        } catch (Exception e) {
            log.error("Error submitting proof of delivery: {}", e.getMessage(), e);
            throw e;
        }
    }

    // ── Fee Estimation ─────────────────────────────────────────────────────────

    @PostMapping("/estimate-fee")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> estimateFee(@RequestBody Map<String, Object> payload) {
        Double distanceKm = payload.get("distanceKm") != null
                ? ((Number) payload.get("distanceKm")).doubleValue() : 0.0;
        Double codAmount = payload.get("codAmount") != null
                ? ((Number) payload.get("codAmount")).doubleValue() : 0.0;
        boolean urgent = Boolean.TRUE.equals(payload.get("urgent"));
        boolean heavy = Boolean.TRUE.equals(payload.get("heavy"));

        return ResponseEntity.ok(pricingService.calculateEstimate(distanceKm, codAmount, urgent, heavy));
    }
}
