package com.deliveryplatform.repository.billing;

import com.deliveryplatform.domain.entity.billing.AgencyCustomerInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgencyCustomerInvoiceRepository extends JpaRepository<AgencyCustomerInvoice, UUID>, JpaSpecificationExecutor<AgencyCustomerInvoice> {
    Optional<AgencyCustomerInvoice> findByAgencyIdAndInvoiceNumber(UUID agencyId, String invoiceNumber);
    boolean existsByAgencyIdAndInvoiceNumber(UUID agencyId, String invoiceNumber);
}
