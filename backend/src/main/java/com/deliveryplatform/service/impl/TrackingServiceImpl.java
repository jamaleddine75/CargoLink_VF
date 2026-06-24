package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.TrackingHistory;
import com.deliveryplatform.repository.TrackingHistoryRepository;
import com.deliveryplatform.service.TrackingService;
import com.deliveryplatform.service.ETAService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TrackingServiceImpl implements TrackingService {

    private final TrackingHistoryRepository trackingHistoryRepository;
    private final ETAService etaService;

    @Override
    public void saveCoordinates(java.util.UUID orderId, Double lat, Double lng) {
        saveTrackingPoint(orderId, lat, lng);
        
        // Update live ETA
        try {
            etaService.updateLiveETA(orderId, lat, lng);
        } catch (Exception e) {
            log.error("Failed to update ETA for order {}: {}", orderId, e.getMessage());
        }
    }

    @Override
    public void saveDriverPosition(java.util.UUID driverId, Double lat, Double lng) {
        log.debug("Saving driver position for driver {}: {}, {}", driverId, lat, lng);
        
        // Trigger cascade ETA calculation
        try {
            etaService.updateCascadeETA(driverId, lat, lng);
        } catch (Exception e) {
            log.error("Failed cascade ETA update for driver {}: {}", driverId, e.getMessage());
        }

        // Save position in history for the current/next order if possible
        // (Optional: could also be saved for all active orders)
    }

    private void saveTrackingPoint(java.util.UUID orderId, Double lat, Double lng) {
        TrackingHistory history = TrackingHistory.builder()
                .orderId(orderId)
                .status("IN_TRANSIT")
                .latitude(lat)
                .longitude(lng)
                .timestamp(LocalDateTime.now())
                .build();
        trackingHistoryRepository.save(history);
    }
    @Override
    public void updateStatus(java.util.UUID orderId, String status) {
        TrackingHistory history = TrackingHistory.builder()
                .orderId(orderId)
                .status(status)
                .timestamp(LocalDateTime.now())
                .build();
        trackingHistoryRepository.save(history);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrackingHistory> getOrderHistory(java.util.UUID orderId) {
        return trackingHistoryRepository.findByOrderIdOrderByTimestampDesc(orderId);
    }
}