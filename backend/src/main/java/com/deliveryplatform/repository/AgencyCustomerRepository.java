package com.deliveryplatform.repository;

import com.deliveryplatform.domain.entity.AgencyCustomer;
import com.deliveryplatform.domain.entity.AgencyCustomerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgencyCustomerRepository extends JpaRepository<AgencyCustomer, UUID> {

    Page<AgencyCustomer> findByAgencyId(UUID agencyId, Pageable pageable);

    Optional<AgencyCustomer> findByIdAndAgencyId(UUID id, UUID agencyId);

    @Query("SELECT c FROM AgencyCustomer c WHERE c.agency.id = :agencyId AND (" +
           "LOWER(c.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.phone) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<AgencyCustomer> searchCustomers(@Param("agencyId") UUID agencyId, @Param("query") String query, Pageable pageable);

    long countByAgencyId(UUID agencyId);

    long countByAgencyIdAndStatus(UUID agencyId, AgencyCustomerStatus status);
}
