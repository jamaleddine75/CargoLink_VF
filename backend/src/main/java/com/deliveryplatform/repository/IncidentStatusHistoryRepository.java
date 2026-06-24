package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.IncidentStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentStatusHistoryRepository extends JpaRepository<IncidentStatusHistory, UUID> {
    List<IncidentStatusHistory> findByIncidentIdOrderByCreatedAtDesc(UUID incidentId);
}
