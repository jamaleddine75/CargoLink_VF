package com.deliveryplatform.service;

import java.util.List;

public interface TrackingService {
    void saveCoordinates(java.util.UUID orderId, Double lat, Double lng);
    void saveDriverPosition(java.util.UUID driverId, Double lat, Double lng);
    void updateStatus(java.util.UUID orderId, String status);
    List<com.deliveryplatform.domain.entity.TrackingHistory> getOrderHistory(java.util.UUID orderId);
}