package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.ClientProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClientProfileRepository extends JpaRepository<ClientProfile, UUID> {
    @Query("SELECT cp FROM ClientProfile cp WHERE cp.user.id = :userId")
    Optional<ClientProfile> findByUserId(@Param("userId") UUID userId);
}
