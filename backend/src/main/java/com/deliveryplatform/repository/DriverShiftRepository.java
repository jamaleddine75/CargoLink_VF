package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.DriverShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DriverShiftRepository extends JpaRepository<DriverShift, UUID> {
    Optional<DriverShift> findByDriverIdAndIsActiveTrue(UUID driverId);
}
