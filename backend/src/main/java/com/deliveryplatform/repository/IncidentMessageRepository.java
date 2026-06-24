package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.IncidentMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentMessageRepository extends JpaRepository<IncidentMessage, UUID> {
    List<IncidentMessage> findByIncidentIdOrderByCreatedAtAsc(UUID incidentId);
}
