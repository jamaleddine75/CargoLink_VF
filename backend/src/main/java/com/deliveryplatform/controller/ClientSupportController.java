package com.deliveryplatform.controller;

import com.deliveryplatform.dto.response.IncidentResponse;
import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.mapper.OrderMapper;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.security.UserPrincipal;
import com.deliveryplatform.service.IncidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/client/support")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENT')")
@lombok.extern.slf4j.Slf4j
public class ClientSupportController {

    private final IncidentService incidentService;
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;

    @GetMapping("/incidents")
    public ResponseEntity<List<IncidentResponse>> getMyIncidents(@AuthenticationPrincipal UserPrincipal principal) {
        log.info("Client Support Access - User: {}, Roles: {}", 
            principal.getEmail(), 
            principal.getAuthorities());
        return ResponseEntity.ok(incidentService.getIncidentsByClientId(principal.getId()));
    }

    @PostMapping("/incidents")
    public ResponseEntity<IncidentResponse> createIncident(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> payload) {
        
        UUID orderId = UUID.fromString(payload.get("orderId"));
        String title = payload.get("title");
        String description = payload.get("description");
        String category = payload.get("category");
        String priority = payload.get("priority");

        // Verify order ownership
        orderRepository.findById(orderId)
                .filter(o -> o.getClient() != null && o.getClient().getId().equals(principal.getId()))
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Unauthorized order access"));

        return ResponseEntity.ok(incidentService.createClientIncident(
                principal.getId(), orderId, title, description, category, priority));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getEligibleOrders(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(orderRepository.findAllByClientId(principal.getId()).stream()
                .map(orderMapper::toResponse)
                .collect(Collectors.toList()));
    }

    @GetMapping("/incidents/{id}/messages")
    public ResponseEntity<List<Object>> getChatMessages(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        // Verify ownership
        incidentService.getIncidentsByClientId(principal.getId()).stream()
                .filter(i -> i.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Unauthorized incident access"));

        return ResponseEntity.ok(incidentService.getChatMessages(id));
    }

    @PostMapping("/incidents/{id}/messages")
    public ResponseEntity<Object> sendChatMessage(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> payload) {
        // Verify ownership
        incidentService.getIncidentsByClientId(principal.getId()).stream()
                .filter(i -> i.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Unauthorized incident access"));

        return ResponseEntity.ok(incidentService.addChatMessage(id, principal.getId(), payload.get("message")));
    }
}
