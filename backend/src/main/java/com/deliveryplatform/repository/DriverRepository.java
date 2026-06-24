package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.Driver;
import com.deliveryplatform.domain.entity.DriverAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DriverRepository extends JpaRepository<Driver, UUID> {
    @Query("SELECT d FROM Driver d WHERE d.user.email = :email")
    Optional<Driver> findByUserEmail(@Param("email") String email);
    
    @Query("SELECT d FROM Driver d WHERE d.user.id = :userId")
    Optional<Driver> findByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT d FROM Driver d WHERE d.agency.id = :agencyId")
    List<Driver> findByAgencyId(@Param("agencyId") UUID agencyId);
    
    @Query("SELECT COUNT(d) FROM Driver d WHERE d.agency.id = :agencyId AND d.user.isActive = :isActive")
    long countByAgencyIdAndUserIsActive(@Param("agencyId") UUID agencyId, @Param("isActive") boolean isActive);

    @Query("SELECT COUNT(d) FROM Driver d WHERE d.agency.id = :agencyId")
    long countByAgencyId(@Param("agencyId") UUID agencyId);

    long countByAvailabilityNot(DriverAvailability availability);
    List<Driver> findByAvailabilityNot(DriverAvailability availability);

    List<Driver> findByAvailability(DriverAvailability availability);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM Driver d WHERE d.verificationStatus = 'APPROVED' AND d.availability = 'AVAILABLE'")
    List<Driver> findAvailableDriversForDispatch();

    List<Driver> findByLatitudeIsNotNullAndLongitudeIsNotNullAndAvailabilityNot(DriverAvailability availability);

    @Query("SELECT d FROM Driver d WHERE d.agency IS NULL")
    List<Driver> findOrphanDrivers();

    @Query("SELECT COUNT(d) FROM Driver d WHERE d.agency IS NULL")
    long countOrphanDrivers();
}