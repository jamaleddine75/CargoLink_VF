package com.deliveryplatform.service;

import com.deliveryplatform.dto.request.AgencyCustomerRequest;
import com.deliveryplatform.dto.response.AgencyCustomerResponse;
import com.deliveryplatform.domain.entity.AgencyCustomerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;
import java.util.UUID;

public interface AgencyCustomerService {
    Page<AgencyCustomerResponse> getCustomers(UUID agencyId, String query, Pageable pageable);
    AgencyCustomerResponse getCustomerDetails(UUID agencyId, UUID customerId);
    AgencyCustomerResponse createCustomer(UUID agencyId, AgencyCustomerRequest request);
    AgencyCustomerResponse updateCustomer(UUID agencyId, UUID customerId, AgencyCustomerRequest request);
    void updateStatus(UUID agencyId, UUID customerId, AgencyCustomerStatus status);
    void deleteCustomer(UUID agencyId, UUID customerId);
    Map<String, Object> getAnalytics(UUID agencyId);
}
