package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.WalletTimeline;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface WalletTimelineRepository extends JpaRepository<WalletTimeline, UUID> {
    Page<WalletTimeline> findByWalletIdOrderByCreatedAtDesc(UUID walletId, Pageable pageable);
}
