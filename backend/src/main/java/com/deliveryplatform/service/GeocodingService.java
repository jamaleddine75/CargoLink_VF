package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.GeocodingResponse;

public interface GeocodingService {
    GeocodingResponse reverseGeocode(double latitude, double longitude);
    void clearCache();
    long getCacheSize();
}
