package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.PlatformTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PlatformTransactionRepository extends JpaRepository<PlatformTransaction, UUID> {
}
