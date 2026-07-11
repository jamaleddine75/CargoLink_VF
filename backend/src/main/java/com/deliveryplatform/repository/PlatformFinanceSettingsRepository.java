package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.PlatformFinanceSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlatformFinanceSettingsRepository extends JpaRepository<PlatformFinanceSettings, UUID> {
    Optional<PlatformFinanceSettings> findTopByOrderByUpdatedAtDesc();
}
