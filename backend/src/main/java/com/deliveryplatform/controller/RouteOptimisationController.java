package com.deliveryplatform.controller;

import com.deliveryplatform.service.RouteOptimisationService;
import com.deliveryplatform.dto.request.ReoptimizeRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/routing")
@RequiredArgsConstructor
@Slf4j
public class RouteOptimisationController {

    private final RouteOptimisationService routeOptimisationService;
    private final com.deliveryplatform.service.ETAService etaService;
    private final com.deliveryplatform.service.OrderService orderService;
    private final com.deliveryplatform.repository.OrderRepository orderRepository;
    private final com.deliveryplatform.repository.DriverRepository driverRepository;


    // 1. Récupérer la route optimisée d'un driver (avec ETAs précalculés)
    @GetMapping("/driver/{driverId}/route")
    @PreAuthorize("hasAnyRole('DRIVER', 'ADMIN', 'AGENCY')")
    public ResponseEntity<com.deliveryplatform.dto.response.RouteResponseDTO> getDriverRoute(@PathVariable UUID driverId) {
        log.info("Fetching optimized route for driver {}", driverId);
        
        List<com.deliveryplatform.domain.entity.Order> activeOrders = orderRepository.findByDriverIdAndStatusIn(driverId, 
            List.of(com.deliveryplatform.domain.entity.OrderStatus.ASSIGNED, 
                    com.deliveryplatform.domain.entity.OrderStatus.PICKED_UP, 
                    com.deliveryplatform.domain.entity.OrderStatus.ON_THE_WAY));
        
        List<java.util.UUID> orderIds = activeOrders.stream().map(com.deliveryplatform.domain.entity.Order::getId).toList();
        List<com.deliveryplatform.dto.response.RouteStopDTO> stops = routeOptimisationService.optimizeDriverRouteWithStops(driverId, orderIds);
        
        return ResponseEntity.ok(com.deliveryplatform.dto.response.RouteResponseDTO.builder()
            .driverId(driverId)
            .stops(stops)
            .totalDistance(0.0) 
            .totalDuration(stops.size() * 15) 
            .estimatedEndTime(stops.isEmpty() ? null : stops.get(stops.size() - 1).getEstimatedArrival())
            .lastOptimizedAt(LocalDateTime.now())
            .build());
    }

    // 2. Re-optimiser + mettre à jour la séquence
    @PostMapping("/driver/{driverId}/reoptimize")
    @PreAuthorize("hasAnyRole('DRIVER', 'ADMIN')")
    public ResponseEntity<com.deliveryplatform.dto.response.RouteResponseDTO> reoptimizeRoute(
            @PathVariable UUID driverId,
            @Valid @RequestBody ReoptimizeRequest request) {
        log.info("Re-optimizing route for driver {}", driverId);

        List<java.util.UUID> orderIds = request.getOrderIds().stream().map(java.util.UUID::fromString).toList();
        
        List<com.deliveryplatform.dto.response.RouteStopDTO> stops = routeOptimisationService.optimizeDriverRouteWithStops(driverId, orderIds);
        
        return ResponseEntity.ok(com.deliveryplatform.dto.response.RouteResponseDTO.builder()
            .driverId(driverId)
            .stops(stops)
            .lastOptimizedAt(LocalDateTime.now())
            .build());
    }

    // 3. Marquer un stop comme complété (avancer à l'étape suivante)
    @PostMapping("/stop/{orderId}/complete-pickup")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Map<String, Object>> completePickup(
            @PathVariable java.util.UUID orderId,
            @RequestBody Map<String, Object> payload) {
        log.info("Completing pickup for order {}", orderId);
        
        Double lat = (Double) payload.get("lat");
        Double lng = (Double) payload.get("lng");
        
        orderService.updateOrderStatus(orderId, null, "PICKED_UP", lat, lng, null, null, null, false);
        
        com.deliveryplatform.domain.entity.Order order = orderRepository.findById(orderId).orElseThrow();
        com.deliveryplatform.dto.response.CascadeETAResult cascade = etaService.updateCascadeETA(order.getDriver().getId(), lat, lng);
        
        return ResponseEntity.ok(Map.of(
            "nextStop", cascade.getStops().isEmpty() ? null : cascade.getStops().get(0),
            "updatedETAs", cascade.getStops()
        ));
    }

    @PostMapping("/stop/{orderId}/complete-delivery")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Map<String, Object>> completeDelivery(
            @PathVariable java.util.UUID orderId,
            @RequestBody Map<String, Object> payload) {
        log.info("Completing delivery for order {}", orderId);
        
        Double lat = (Double) payload.get("lat");
        Double lng = (Double) payload.get("lng");
        Boolean codCollected = (Boolean) payload.get("codCollected");
        
        orderService.updateOrderStatus(orderId, null, "DELIVERED", lat, lng, null, null, null, codCollected);
        
        com.deliveryplatform.domain.entity.Order order = orderRepository.findById(orderId).orElseThrow();
        com.deliveryplatform.dto.response.CascadeETAResult cascade = etaService.updateCascadeETA(order.getDriver().getId(), lat, lng);
        
        return ResponseEntity.ok(Map.of(
            "nextStop", cascade == null || cascade.getStops().isEmpty() ? null : cascade.getStops().get(0),
            "updatedETAs", cascade == null ? List.of() : cascade.getStops()
        ));
    }

    // 4. Réordonner manuellement (drag & drop côté driver)
    @PutMapping("/driver/{driverId}/reorder")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Map<String, Object>> reorderRoute(
            @PathVariable UUID driverId,
            @RequestBody Map<String, List<String>> payload) {
        log.info("Manual reorder for driver {}", driverId);
        
        List<String> orderedStopIdsStr = payload.get("orderedStopIds");
        List<java.util.UUID> orderedStopIds = orderedStopIdsStr.stream().map(java.util.UUID::fromString).toList();
        
        // Update sequenceIndex for each order
        for (int i = 0; i < orderedStopIds.size(); i++) {
            final int index = i;
            orderRepository.findById(orderedStopIds.get(i)).ifPresent(o -> {
                o.setSequenceIndex(index);
                orderRepository.save(o);
            });
        }
        
        com.deliveryplatform.domain.entity.Driver driver = driverRepository.findById(driverId).orElseThrow();
        com.deliveryplatform.dto.response.CascadeETAResult cascade = etaService.updateCascadeETA(driverId, driver.getLatitude(), driver.getLongitude());
        
        return ResponseEntity.ok(Map.of(
            "message", "OK",
            "recalculatedETAs", cascade.getStops()
        ));
    }

    // 5. Obtenir l'ETA live pour tous les stops du driver
    @GetMapping("/driver/{driverId}/eta-cascade")
    @PreAuthorize("hasAnyRole('DRIVER', 'ADMIN', 'CUSTOMER')")
    public ResponseEntity<com.deliveryplatform.dto.response.CascadeETAResult> getEtaCascade(@PathVariable UUID driverId) {
        com.deliveryplatform.domain.entity.Driver driver = driverRepository.findById(driverId)
            .or(() -> driverRepository.findByUserId(driverId))
            .orElseThrow(() -> new com.deliveryplatform.exception.ResourceNotFoundException("Driver", "id/userId", driverId));
        double lat = driver.getLatitude() != null ? driver.getLatitude() : 0.0;
        double lng = driver.getLongitude() != null ? driver.getLongitude() : 0.0;
        return ResponseEntity.ok(etaService.updateCascadeETA(driver.getId(), lat, lng));
    }

    private double haversineKm(Double lat1, Double lng1, Double lat2, Double lng2) {
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return 0.0;
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // 6. Statistiques de la tournée (pour admin/agency dashboard)
    @GetMapping("/driver/{driverId}/tour-stats")
    @PreAuthorize("hasAnyRole('DRIVER', 'ADMIN', 'AGENCY')")
    public ResponseEntity<com.deliveryplatform.dto.response.TourStatsResponse> getTourStats(@PathVariable UUID driverId) {
        try {
            com.deliveryplatform.domain.entity.Driver driver = driverRepository.findById(driverId)
                .or(() -> driverRepository.findByUserId(driverId))
                .orElse(null);

            if (driver == null) {
                return ResponseEntity.ok(com.deliveryplatform.dto.response.TourStatsResponse.builder()
                    .totalOrders(0L)
                    .completedOrders(0L)
                    .pendingOrders(0L)
                    .onTimeRate(100.0)
                    .delayedCount(0L)
                    .totalDistanceCovered(0.0)
                    .totalDistanceRemaining(0.0)
                    .avgTimePerStop(0.0)
                    .currentEfficiency(1.0)
                    .build());
            }

            long total = orderRepository.countByDriverId(driver.getId());
            long completed = orderRepository.countByDriverIdAndStatus(driver.getId(), com.deliveryplatform.domain.entity.OrderStatus.DELIVERED);
            long delayed = 0;

            List<com.deliveryplatform.domain.entity.Order> completedOrders = orderRepository.findByDriverIdAndStatusIn(
                driver.getId(), List.of(com.deliveryplatform.domain.entity.OrderStatus.DELIVERED));
            List<com.deliveryplatform.domain.entity.Order> remainingOrders = orderRepository.findByDriverIdAndStatusIn(
                driver.getId(), List.of(
                    com.deliveryplatform.domain.entity.OrderStatus.ASSIGNED,
                    com.deliveryplatform.domain.entity.OrderStatus.PICKED_UP,
                    com.deliveryplatform.domain.entity.OrderStatus.ON_THE_WAY));

            double distanceCovered = completedOrders.stream()
                .mapToDouble(o -> haversineKm(o.getPickupLat(), o.getPickupLng(), o.getDeliveryLat(), o.getDeliveryLng()))
                .sum();
            double distanceRemaining = remainingOrders.stream()
                .mapToDouble(o -> haversineKm(o.getPickupLat(), o.getPickupLng(), o.getDeliveryLat(), o.getDeliveryLng()))
                .sum();

            return ResponseEntity.ok(com.deliveryplatform.dto.response.TourStatsResponse.builder()
                .totalOrders(total)
                .completedOrders(completed)
                .pendingOrders(Math.max(0L, total - completed))
                .onTimeRate(total > 0 ? ((total - delayed) * 100.0 / total) : 100.0)
                .delayedCount(delayed)
                .totalDistanceCovered(Math.round(distanceCovered * 10.0) / 10.0)
                .totalDistanceRemaining(Math.round(distanceRemaining * 10.0) / 10.0)
                .avgTimePerStop(20.0)
                .currentEfficiency(0.95)
                .build());
        } catch (Exception e) {
            log.error("Failed to compute tour stats for {}: {}", driverId, e.getMessage(), e);
            return ResponseEntity.ok(com.deliveryplatform.dto.response.TourStatsResponse.builder()
                .totalOrders(0L)
                .completedOrders(0L)
                .pendingOrders(0L)
                .onTimeRate(100.0)
                .delayedCount(0L)
                .totalDistanceCovered(0.0)
                .totalDistanceRemaining(0.0)
                .avgTimePerStop(0.0)
                .currentEfficiency(1.0)
                .build());
        }
    }
}
