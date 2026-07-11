package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.Agency;
import java.util.Optional;

public interface AgencyDiscoveryService {
    /**
     * Finds the most appropriate agency based on city using a deterministic assignment algorithm.
     * 
     * @param city City name
     * @return The assigned agency
     * @throws RuntimeException if no suitable agency is found
     */
    Agency assignAgency(String city);
}
