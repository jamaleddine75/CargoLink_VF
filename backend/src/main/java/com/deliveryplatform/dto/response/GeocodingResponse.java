package com.deliveryplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeocodingResponse {
    private boolean success;
    private String errorType; // TIMEOUT, RATE_LIMIT, NETWORK_ERROR, INVALID_RESPONSE, etc.
    private String errorMessage;
    private GeocodingAddress address;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeocodingAddress {
        private String displayName;
        private String road;
        private String houseNumber;
        private String suburb;
        private String neighbourhood;
        private String city;
        private String postcode;
        private String state;
        private String country;
    }
}
