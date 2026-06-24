package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.Incident;
import com.deliveryplatform.domain.entity.IncidentMessage;
import com.deliveryplatform.domain.entity.IncidentStatusHistory;
import com.deliveryplatform.dto.response.IncidentResponse;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.mapper.IncidentMapper;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.IncidentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class IncidentServiceImpl implements IncidentService {

    private final IncidentRepository incidentRepository;
    private final OrderRepository orderRepository;
    private final IncidentMapper incidentMapper;
    private final com.deliveryplatform.service.WebSocketEventService wsEventService;
    private final IncidentMessageRepository incidentMessageRepository;
    private final IncidentAttachmentRepository incidentAttachmentRepository;
    private final IncidentStatusHistoryRepository incidentStatusHistoryRepository;

    @Override
    public IncidentResponse createIncident(java.util.UUID orderId, String title, String description, String category) {
        Incident incident = Incident.builder()
                .orderId(orderId)
                .title(title)
                .description(description)
                .category(category)
                .status("OPEN")
                .createdAt(LocalDateTime.now())
                .build();
        
        Incident saved = incidentRepository.save(incident);
        log.info("Incident created for order {}: {}", orderId, title);

        // Realtime: Notify admin dashboard of new incident
        IncidentResponse response = incidentMapper.toResponse(saved);
        wsEventService.broadcastIncidentEvent(orderId, "CREATED", response);

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentResponse> getAllIncidents() {
        return incidentRepository.findAll().stream()
                .sorted(Comparator.comparing(Incident::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(incidentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentResponse> getIncidentsByAgencyId(UUID agencyId) {
        Set<UUID> orderIds = orderRepository.findByAgencyId(agencyId).stream()
                .map(com.deliveryplatform.domain.entity.Order::getId)
                .collect(Collectors.toSet());

        if (orderIds.isEmpty()) {
            return List.of();
        }

        return incidentRepository.findAll().stream()
                .filter(incident -> incident.getOrderId() != null && orderIds.contains(incident.getOrderId()))
                .sorted(Comparator.comparing(Incident::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(incidentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentResponse> getIncidentsByOrderId(java.util.UUID orderId) {
        // Simple findAll and filter for now, or add method to repo
        return incidentRepository.findAll().stream()
                .filter(i -> i.getOrderId().equals(orderId))
                .sorted(Comparator.comparing(Incident::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(incidentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public IncidentResponse createClientIncident(UUID clientId, UUID orderId, String title, String description, String category, String priority) {
        Incident incident = Incident.builder()
                .clientId(clientId)
                .orderId(orderId)
                .title(title)
                .description(description)
                .category(category)
                .status("OPEN")
                .priority(priority != null ? priority : "MEDIUM")
                .source("CLIENT")
                .createdAt(LocalDateTime.now())
                .build();
        
        Incident saved = incidentRepository.save(incident);
        
        // Track status history
        incidentStatusHistoryRepository.save(IncidentStatusHistory.builder()
                .incidentId(saved.getId())
                .status("OPEN")
                .changedBy(clientId)
                .comment("Incident created by customer")
                .build());

        IncidentResponse response = incidentMapper.toResponse(saved);
        wsEventService.broadcastIncidentEvent(orderId, "CREATED", response);
        
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentResponse> getIncidentsByClientId(UUID clientId) {
        return incidentRepository.findAll().stream()
                .filter(i -> clientId.equals(i.getClientId()))
                .sorted(Comparator.comparing(Incident::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(incidentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public IncidentResponse updateIncident(UUID incidentId, String status, String resolution) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", incidentId));
        
        String oldStatus = incident.getStatus();
        if (status != null && !status.equals(oldStatus)) {
            incident.setStatus(status);
            // Track history
            incidentStatusHistoryRepository.save(IncidentStatusHistory.builder()
                    .incidentId(incidentId)
                    .status(status)
                    .comment("Status changed from " + oldStatus + " to " + status)
                    .build());
        }
        
        if (resolution != null) {
            incident.setResolution(resolution);
        }
        
        Incident saved = incidentRepository.save(incident);
        IncidentResponse response = incidentMapper.toResponse(saved);
        
        // Notify both admin and client
        wsEventService.broadcastIncidentStatusUpdate(incidentId, incident.getClientId(), response);
        
        return response;
    }

    @Override
    public void updateIncidentStatus(UUID id, String status) {
        updateIncident(id, status, null);
    }

    @Override
    public IncidentResponse updatePriority(UUID incidentId, String priority) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", incidentId));
        incident.setPriority(priority);
        Incident saved = incidentRepository.save(incident);
        IncidentResponse response = incidentMapper.toResponse(saved);
        wsEventService.broadcastIncidentEvent(incident.getOrderId(), "UPDATED", response);
        return response;
    }

    @Override
    public IncidentResponse assignIncident(UUID incidentId, UUID assignedTo) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", incidentId));
        incident.setAssignedTo(assignedTo);
        Incident saved = incidentRepository.save(incident);
        IncidentResponse response = incidentMapper.toResponse(saved);
        wsEventService.broadcastIncidentEvent(incident.getOrderId(), "UPDATED", response);
        return response;
    }

    @Override
    public IncidentResponse addNote(UUID incidentId, String note) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", incidentId));
        String currentNotes = incident.getNotes() != null ? incident.getNotes() : "";
        String timestamp = LocalDateTime.now().toString();
        String newNoteEntry = String.format("[%s] %s\n", timestamp, note);
        incident.setNotes(currentNotes + newNoteEntry);
        Incident saved = incidentRepository.save(incident);
        IncidentResponse response = incidentMapper.toResponse(saved);
        wsEventService.broadcastIncidentEvent(incident.getOrderId(), "UPDATED", response);
        return response;
    }

    @Override
    public Object addChatMessage(UUID incidentId, UUID senderId, String message) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", incidentId));
        
        IncidentMessage chatMsg = IncidentMessage.builder()
                .incidentId(incidentId)
                .senderId(senderId)
                .message(message)
                .createdAt(LocalDateTime.now())
                .build();
        
        IncidentMessage saved = incidentMessageRepository.save(chatMsg);
        
        // Broadcast via WS
        wsEventService.broadcastIncidentChatMessage(incidentId, saved);
        
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Object> getChatMessages(UUID incidentId) {
        return incidentMessageRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId).stream()
                .map(m -> (Object) m)
                .collect(Collectors.toList());
    }
}