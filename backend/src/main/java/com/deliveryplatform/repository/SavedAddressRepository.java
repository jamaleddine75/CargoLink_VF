package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.SavedAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SavedAddressRepository extends JpaRepository<SavedAddress, UUID> {
    List<SavedAddress> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
