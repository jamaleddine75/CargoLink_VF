package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.DriverBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DriverBadgeRepository extends JpaRepository<DriverBadge, UUID> {
    List<DriverBadge> findByDriverIdOrderByEarnedAtDesc(UUID driverId);
}
