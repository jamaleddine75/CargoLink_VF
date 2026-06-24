package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.IncidentResponse;
import java.util.List;
import java.util.UUID;

public interface IncidentService {
    IncidentResponse createIncident(java.util.UUID orderId, String title, String description, String category);
    IncidentResponse createClientIncident(UUID clientId, UUID orderId, String title, String description, String category, String priority);
    
    IncidentResponse updateIncident(UUID incidentId, String status, String resolution);
    List<IncidentResponse> getAllIncidents();
    List<IncidentResponse> getIncidentsByClientId(UUID clientId);
    List<IncidentResponse> getIncidentsByAgencyId(java.util.UUID agencyId);
    List<IncidentResponse> getIncidentsByOrderId(java.util.UUID orderId);
    void updateIncidentStatus(UUID id, String status);
    IncidentResponse updatePriority(UUID incidentId, String priority);
    IncidentResponse assignIncident(UUID incidentId, UUID assignedTo);
    IncidentResponse addNote(UUID incidentId, String note);

    // Chat
    Object addChatMessage(UUID incidentId, UUID senderId, String message);
    List<Object> getChatMessages(UUID incidentId);
}