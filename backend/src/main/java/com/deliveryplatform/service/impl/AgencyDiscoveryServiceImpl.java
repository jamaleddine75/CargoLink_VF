package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.repository.AgencyRepository;
import com.deliveryplatform.service.AgencyDiscoveryService;
import com.deliveryplatform.exception.BusinessException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgencyDiscoveryServiceImpl implements AgencyDiscoveryService {

    private final AgencyRepository agencyRepository;

    @Override
    public Agency discoverNearestAgency(String city, Double lat, Double lng) {
        log.info("Attempting to discover agency for city: {}, coordinates: [{}, {}]", city, lat, lng);

        // Use specific query for active, non-deleted agencies (including those with null/blank status)
        List<Agency> allAgencies = agencyRepository.findAllActiveAgenciesForDiscovery();

        if (allAgencies.isEmpty()) {
            throw new BusinessException("No active agencies found in the system. Registration is currently unavailable.");
        }


        // 1. If coordinates are provided, find the globally nearest agency
        if (lat != null && lng != null) {
            return allAgencies.stream()
                    .filter(a -> a.getLatitude() != null && a.getLongitude() != null)
                    .min(Comparator.comparingDouble(a -> calculateDistance(lat, lng, a.getLatitude(), a.getLongitude())))
                    .orElseGet(() -> {
                        log.warn("Coordinates provided but no agencies have valid coordinates. Falling back to city matching.");
                        return findByCityFallback(allAgencies, city);
                    });
        }

        // 2. Fallback to city-based matching
        return findByCityFallback(allAgencies, city);
    }

    private Agency findByCityFallback(List<Agency> allAgencies, String city) {
        if (city == null || city.isBlank()) {
            throw new BusinessException("Insufficient location information. Please provide a city or coordinates.");
        }

        String normalizedCity = city.trim().toLowerCase();
        return allAgencies.stream()
                .filter(a -> a.getCity() != null && a.getCity().toLowerCase().contains(normalizedCity))
                .findFirst()
                .orElseThrow(() -> new BusinessException("No agency found serving the city: " + city + ". Please contact support for assistance."));
    }


    /**
     * Haversine formula to calculate distance between two points in km
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double theta = lon1 - lon2;
        double dist = Math.sin(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) + 
                      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(deg2rad(theta));
        dist = Math.acos(dist);
        dist = rad2deg(dist);
        dist = dist * 60 * 1.1515 * 1.609344;
        return dist;
    }

    private double deg2rad(double deg) {
        return (deg * Math.PI / 180.0);
    }

    private double rad2deg(double rad) {
        return (rad * 180.0 / Math.PI);
    }
}
