package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.AssignmentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssignmentHistoryRepository extends JpaRepository<AssignmentHistory, UUID> {
    List<AssignmentHistory> findByOrderIdOrderByAssignedAtDesc(UUID orderId);
    List<AssignmentHistory> findByNewDriverIdOrderByAssignedAtDesc(UUID driverId);
    List<AssignmentHistory> findByPreviousDriverIdOrderByAssignedAtDesc(UUID driverId);
    long countByOrderId(UUID orderId);
}
