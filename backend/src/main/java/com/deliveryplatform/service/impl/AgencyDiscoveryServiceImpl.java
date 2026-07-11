package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.repository.AgencyRepository;
import com.deliveryplatform.repository.DriverRepository;
import com.deliveryplatform.repository.AgencyCustomerRepository;
import com.deliveryplatform.service.AgencyDiscoveryService;
import com.deliveryplatform.exception.BusinessException;
import com.deliveryplatform.domain.entity.AgencyCustomerStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgencyDiscoveryServiceImpl implements AgencyDiscoveryService {

    private final AgencyRepository agencyRepository;
    private final DriverRepository driverRepository;
    private final AgencyCustomerRepository agencyCustomerRepository;

    @Override
    public Agency assignAgency(String city) {
        log.info("Assigning agency for city: {}", city);

        if (city == null || city.isBlank()) {
            throw new BusinessException("City is required for agency assignment.");
        }

        String normalizedCity = city.trim().toLowerCase();

        // 1. Search all active, non-deleted agencies
        List<Agency> allAgencies = agencyRepository.findAllActiveAgenciesForDiscovery();
        
        List<Agency> cityAgencies = allAgencies.stream()
                .filter(a -> a.getCity() != null && a.getCity().toLowerCase().contains(normalizedCity))
                .collect(Collectors.toList());

        // 2. If no agency exists in the selected city
        if (cityAgencies.isEmpty()) {
            log.warn("No agency found serving the city: {}", city);
            throw new BusinessException("No agency is currently available in the selected city.");
        }

        // 3. If exactly one agency exists
        if (cityAgencies.size() == 1) {
            Agency assigned = cityAgencies.get(0);
            log.info("Only one agency in {}, assigned directly to: {}", city, assigned.getId());
            return assigned;
        }

        // 4. If multiple agencies exist, use deterministic assignment
        log.info("Multiple agencies found in {}, applying deterministic assignment...", city);
        return cityAgencies.stream()
            .min((a1, a2) -> {
                // Criteria 1: Fewest ACTIVE drivers
                long d1 = driverRepository.countActiveDriversByAgencyId(a1.getId());
                long d2 = driverRepository.countActiveDriversByAgencyId(a2.getId());
                if (d1 != d2) return Long.compare(d1, d2);
                
                // Criteria 2: Fewest ACTIVE customers
                long c1 = agencyCustomerRepository.countByAgencyIdAndStatus(a1.getId(), AgencyCustomerStatus.ACTIVE);
                long c2 = agencyCustomerRepository.countByAgencyIdAndStatus(a2.getId(), AgencyCustomerStatus.ACTIVE);
                if (c1 != c2) return Long.compare(c1, c2);
                
                // Criteria 3: Oldest agency (createdAt ASC)
                java.time.LocalDateTime t1 = a1.getCreatedAt() != null ? a1.getCreatedAt() : java.time.LocalDateTime.MAX;
                java.time.LocalDateTime t2 = a2.getCreatedAt() != null ? a2.getCreatedAt() : java.time.LocalDateTime.MAX;
                return t1.compareTo(t2);
            })
            .orElseThrow(() -> new BusinessException("Failed to determine an agency for the selected city."));
    }
}
