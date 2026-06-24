package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.Agency;
import java.util.Optional;

public interface AgencyDiscoveryService {
    /**
     * Finds the most appropriate agency based on city and/or coordinates.
     * 
     * @param city Optional city name
     * @param lat Optional latitude
     * @param lng Optional longitude
     * @return The best matching agency
     * @throws RuntimeException if no suitable agency is found
     */
    Agency discoverNearestAgency(String city, Double lat, Double lng);
}
