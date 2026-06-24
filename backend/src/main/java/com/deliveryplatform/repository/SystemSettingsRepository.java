package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.SystemSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SystemSettingsRepository extends JpaRepository<SystemSettings, UUID> {
    Optional<SystemSettings> findFirstByOrderById();
}
