package com.deliveryplatform.repository.billing;

import com.deliveryplatform.domain.entity.billing.CODReconciliation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CODReconciliationRepository extends JpaRepository<CODReconciliation, UUID>, JpaSpecificationExecutor<CODReconciliation> {
}
