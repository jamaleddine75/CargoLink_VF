package com.deliveryplatform.controller;

import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.service.OrderService;
import com.deliveryplatform.repository.AgencyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Slf4j
public class PublicController {

    private final OrderService orderService;
    private final AgencyRepository agencyRepository;

    @GetMapping("/tracking/{trackingNumber}")
    public ResponseEntity<OrderResponse> getOrderTracking(@PathVariable String trackingNumber) {
        log.info("Public tracking request for: {}", trackingNumber);
        return ResponseEntity.ok(orderService.findByTrackingNumber(trackingNumber));
    }

    @GetMapping("/order-history/{trackingNumber}")
    public ResponseEntity<List<?>> getOrderHistory(@PathVariable String trackingNumber) {
        OrderResponse order = orderService.findByTrackingNumber(trackingNumber);
        return ResponseEntity.ok(orderService.getOrderTracking(UUID.fromString(order.getId())));
    }

    @GetMapping("/available-cities")
    public ResponseEntity<List<String>> getAvailableCities() {
        log.info("Fetching all distinct operational cities from active agencies");
        
        // Debug: Log all agencies to see what's in the DB
        java.util.List<com.deliveryplatform.domain.entity.Agency> allAgencies = agencyRepository.findAll();
        log.info("DEBUG: Total agencies in DB: {}", allAgencies.size());
        allAgencies.forEach(a -> log.info("DEBUG: Agency: {}, City: {}, Deleted: {}, Status: {}", 
            a.getName(), a.getCity(), a.getDeleted(), a.getOperationalStatus()));

        List<String> cities = agencyRepository.findDistinctCitiesByDeletedFalseAndOperationalStatusActive();
        
        // Normalize to Title Case (e.g. fnideq -> Fnideq)
        List<String> normalizedCities = cities.stream()
            .filter(c -> c != null && !c.isBlank())
            .map(c -> {
                String trimmed = c.trim();
                if (trimmed.isEmpty()) return trimmed;
                return trimmed.substring(0, 1).toUpperCase() + trimmed.substring(1).toLowerCase();
            })

            .distinct() // Secondary safeguard
            .collect(java.util.stream.Collectors.toList());

        log.info("Found {} operational cities from query (normalized to {})", cities.size(), normalizedCities.size());
        return ResponseEntity.ok(normalizedCities);
    }


}
