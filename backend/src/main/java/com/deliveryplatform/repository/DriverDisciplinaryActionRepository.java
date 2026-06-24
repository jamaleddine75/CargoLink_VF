package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.DriverDisciplinaryAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DriverDisciplinaryActionRepository extends JpaRepository<DriverDisciplinaryAction, UUID> {
    List<DriverDisciplinaryAction> findAllByDriverIdOrderByCreatedAtDesc(UUID driverId);
    List<DriverDisciplinaryAction> findAllByAgencyIdOrderByCreatedAtDesc(UUID agencyId);
}
