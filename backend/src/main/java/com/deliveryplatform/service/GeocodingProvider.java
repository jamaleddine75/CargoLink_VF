package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.GeocodingResponse;

public interface GeocodingProvider {
    GeocodingResponse.GeocodingAddress reverse(double latitude, double longitude);
}
