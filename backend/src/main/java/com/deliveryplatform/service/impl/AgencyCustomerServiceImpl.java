package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.domain.entity.AgencyCustomer;
import com.deliveryplatform.domain.entity.AgencyCustomerStatus;
import com.deliveryplatform.dto.request.AgencyCustomerRequest;
import com.deliveryplatform.dto.response.AgencyCustomerResponse;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.mapper.AgencyCustomerMapper;
import com.deliveryplatform.repository.AgencyCustomerRepository;
import com.deliveryplatform.repository.AgencyRepository;
import com.deliveryplatform.service.AgencyCustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgencyCustomerServiceImpl implements AgencyCustomerService {

    private final AgencyCustomerRepository customerRepository;
    private final AgencyRepository agencyRepository;
    private final AgencyCustomerMapper customerMapper;

    @Override
    public Page<AgencyCustomerResponse> getCustomers(UUID agencyId, String query, Pageable pageable) {
        Page<AgencyCustomer> customers;
        if (query != null && !query.isBlank()) {
            customers = customerRepository.searchCustomers(agencyId, query, pageable);
        } else {
            customers = customerRepository.findByAgencyId(agencyId, pageable);
        }
        return customers.map(customerMapper::toResponse);
    }

    @Override
    public AgencyCustomerResponse getCustomerDetails(UUID agencyId, UUID customerId) {
        AgencyCustomer customer = customerRepository.findByIdAndAgencyId(customerId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        return customerMapper.toResponse(customer);
    }

    @Override
    @Transactional
    public AgencyCustomerResponse createCustomer(UUID agencyId, AgencyCustomerRequest request) {
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agency not found"));

        AgencyCustomer customer = customerMapper.toEntity(request);
        customer.setAgency(agency);
        
        return customerMapper.toResponse(customerRepository.save(customer));
    }

    @Override
    @Transactional
    public AgencyCustomerResponse updateCustomer(UUID agencyId, UUID customerId, AgencyCustomerRequest request) {
        AgencyCustomer customer = customerRepository.findByIdAndAgencyId(customerId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        customerMapper.updateEntity(customer, request);
        return customerMapper.toResponse(customerRepository.save(customer));
    }

    @Override
    @Transactional
    public void updateStatus(UUID agencyId, UUID customerId, AgencyCustomerStatus status) {
        AgencyCustomer customer = customerRepository.findByIdAndAgencyId(customerId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        
        customer.setStatus(status);
        customerRepository.save(customer);
    }

    @Override
    @Transactional
    public void deleteCustomer(UUID agencyId, UUID customerId) {
        AgencyCustomer customer = customerRepository.findByIdAndAgencyId(customerId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        
        customer.setDeleted(true);
        customerRepository.save(customer);
    }

    @Override
    public Map<String, Object> getAnalytics(UUID agencyId) {
        Map<String, Object> stats = new HashMap<>();
        
        long totalCustomers = customerRepository.countByAgencyId(agencyId);
        long activeCustomers = customerRepository.countByAgencyIdAndStatus(agencyId, AgencyCustomerStatus.ACTIVE);
        long blockedCustomers = customerRepository.countByAgencyIdAndStatus(agencyId, AgencyCustomerStatus.BLOCKED);
        
        stats.put("totalCustomers", totalCustomers);
        stats.put("activeCustomers", activeCustomers);
        stats.put("blockedCustomers", blockedCustomers);
        
        // This is a simplified version, in a real app we'd query for top customers
        Page<AgencyCustomer> topCustomersPage = customerRepository.findByAgencyId(agencyId, Pageable.ofSize(5));
        List<AgencyCustomerResponse> topCustomers = topCustomersPage.getContent().stream()
                .map(customerMapper::toResponse)
                .collect(Collectors.toList());
        
        stats.put("topCustomers", topCustomers);
        
        // Revenue and Success Rate would ideally be calculated across all customers or from a separate stats table
        BigDecimal totalRevenue = customerRepository.findByAgencyId(agencyId, Pageable.unpaged())
                .getContent().stream()
                .map(AgencyCustomer::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        stats.put("totalRevenue", totalRevenue);
        
        return stats;
    }
}
