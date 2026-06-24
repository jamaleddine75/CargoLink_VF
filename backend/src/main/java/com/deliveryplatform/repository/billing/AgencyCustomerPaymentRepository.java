package com.deliveryplatform.repository.billing;

import com.deliveryplatform.domain.entity.billing.AgencyCustomerPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AgencyCustomerPaymentRepository extends JpaRepository<AgencyCustomerPayment, UUID>, JpaSpecificationExecutor<AgencyCustomerPayment> {
}
