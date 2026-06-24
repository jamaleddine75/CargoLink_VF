package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.AgencyPayoutRequest;
import com.deliveryplatform.domain.entity.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AgencyPayoutRequestRepository extends JpaRepository<AgencyPayoutRequest, UUID> {
    List<AgencyPayoutRequest> findByAgencyIdOrderByRequestedAtDesc(UUID agencyId);
    List<AgencyPayoutRequest> findByStatusOrderByRequestedAtDesc(TransactionStatus status);
    Page<AgencyPayoutRequest> findByStatus(TransactionStatus status, Pageable pageable);
    long countByStatus(TransactionStatus status);
}
