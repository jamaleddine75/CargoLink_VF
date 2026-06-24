package com.deliveryplatform.repository.billing;

import com.deliveryplatform.domain.entity.billing.DriverFinancialRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DriverFinancialRecordRepository extends JpaRepository<DriverFinancialRecord, UUID> {
    Optional<DriverFinancialRecord> findByDriverId(UUID driverId);
    Optional<DriverFinancialRecord> findByAgencyIdAndDriverId(UUID agencyId, UUID driverId);
}
