package com.deliveryplatform.controller;

import com.deliveryplatform.dto.response.IncidentResponse;
import com.deliveryplatform.security.UserPrincipal;
import com.deliveryplatform.service.IncidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<List<IncidentResponse>> getAllIncidents() {
        return ResponseEntity.ok(incidentService.getAllIncidents());
    }

    @GetMapping("/agency/{agencyId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<List<IncidentResponse>> getAgencyIncidents(
            @PathVariable UUID agencyId,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean isAdmin = principal != null && principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);

        if (!isAdmin) {
            UUID principalAgencyId = principal != null ? principal.getRequiredAgencyId() : null;
            if (principalAgencyId == null || !principalAgencyId.equals(agencyId)) {
                throw new org.springframework.security.access.AccessDeniedException("Cannot access another agency's incidents.");
            }
        }

        return ResponseEntity.ok(incidentService.getIncidentsByAgencyId(agencyId));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<IncidentResponse>> getOrderIncidents(@PathVariable UUID orderId) {
        return ResponseEntity.ok(incidentService.getIncidentsByOrderId(orderId));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<IncidentResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(incidentService.updateIncident(id, payload.get("status"), payload.get("resolution")));
    }

    @PutMapping("/{id}/priority")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<IncidentResponse> updatePriority(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(incidentService.updatePriority(id, payload.get("priority")));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IncidentResponse> assignIncident(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        UUID assignedTo = payload.containsKey("assignedTo") && payload.get("assignedTo") != null ? UUID.fromString(payload.get("assignedTo")) : null;
        return ResponseEntity.ok(incidentService.assignIncident(id, assignedTo));
    }

    @PostMapping("/{id}/notes")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<IncidentResponse> addNote(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(incidentService.addNote(id, payload.get("note")));
    }

    @GetMapping("/{id}/messages")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<List<Object>> getChatMessages(@PathVariable UUID id) {
        return ResponseEntity.ok(incidentService.getChatMessages(id));
    }

    @PostMapping("/{id}/messages")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY')")
    public ResponseEntity<Object> sendChatMessage(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(incidentService.addChatMessage(id, principal.getId(), payload.get("message")));
    }
}