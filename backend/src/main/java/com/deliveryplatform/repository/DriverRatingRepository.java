package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.DriverRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.Optional;

@Repository
public interface DriverRatingRepository extends JpaRepository<DriverRating, UUID> {
    
    Optional<DriverRating> findByOrderId(java.util.UUID orderId);

    @Query("SELECT AVG(r.rating) FROM DriverRating r WHERE r.driver.id = :driverId")
    Double getAverageRatingForDriver(@Param("driverId") UUID driverId);
    
    @Query("SELECT COUNT(r) FROM DriverRating r WHERE r.driver.id = :driverId")
    Integer getRatingCountForDriver(@Param("driverId") UUID driverId);
}
