package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.PricingConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PricingConfigRepository extends JpaRepository<PricingConfig, UUID> {
    Optional<PricingConfig> findByActiveTrue();
}
