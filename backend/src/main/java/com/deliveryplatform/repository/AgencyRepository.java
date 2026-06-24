package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.Agency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AgencyRepository extends JpaRepository<Agency, UUID> {
    java.util.Optional<Agency> findByAdminAgencyId(UUID adminId);

    java.util.Optional<Agency> findByCityIgnoreCaseAndDeletedFalse(String city);

    java.util.List<Agency> findByDeletedFalseOrderByCity();
    java.util.List<Agency> findAllByDeletedFalse();
    java.util.List<Agency> findByDeletedFalseAndOperationalStatus(String status);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Agency a WHERE a.deleted = false AND (UPPER(a.operationalStatus) = 'ACTIVE' OR a.operationalStatus IS NULL OR a.operationalStatus = '')")
    java.util.List<Agency> findAllActiveAgenciesForDiscovery();




    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT LOWER(TRIM(a.city)) FROM Agency a WHERE a.deleted = false AND (UPPER(a.operationalStatus) = 'ACTIVE' OR a.operationalStatus IS NULL OR a.operationalStatus = '') AND a.city IS NOT NULL AND TRIM(a.city) <> '' ORDER BY LOWER(TRIM(a.city)) ASC")
    java.util.List<String> findDistinctCitiesByDeletedFalseAndOperationalStatusActive();



}
