package com.deliveryplatform.service.impl;

import com.deliveryplatform.dto.response.GeocodingResponse;
import com.deliveryplatform.service.GeocodingProvider;
import com.deliveryplatform.service.GeocodingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import jakarta.annotation.PostConstruct;
import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.TimeoutException;
import java.util.regex.Pattern;

@Service
@Slf4j
public class GeocodingServiceImpl implements GeocodingService {

    @Autowired
    private GeocodingProvider geocodingProvider;

    @Value("${geocoding.cache-ttl:30m}")
    private String ttlConfig;

    @Value("${geocoding.max-cache-size:500}")
    private int maxCacheSize;

    private Duration ttl;
    private Map<String, CacheEntry> cache;

    private static class CacheEntry {
        private final GeocodingResponse.GeocodingAddress address;
        private final Instant expiryTime;

        public CacheEntry(GeocodingResponse.GeocodingAddress address, Duration ttl) {
            // Shallow clone/copy display address to prevent modification of cached item directly
            this.address = GeocodingResponse.GeocodingAddress.builder()
                    .displayName(address.getDisplayName())
                    .road(address.getRoad())
                    .houseNumber(address.getHouseNumber())
                    .suburb(address.getSuburb())
                    .neighbourhood(address.getNeighbourhood())
                    .city(address.getCity())
                    .postcode(address.getPostcode())
                    .state(address.getState())
                    .country(address.getCountry())
                    .build();
            this.expiryTime = Instant.now().plus(ttl);
        }

        public boolean isExpired() {
            return Instant.now().isAfter(expiryTime);
        }
    }

    @PostConstruct
    public void init() {
        long minutes = 30;
        if (ttlConfig != null && ttlConfig.endsWith("m")) {
            try {
                minutes = Long.parseLong(ttlConfig.substring(0, ttlConfig.length() - 1));
            } catch (NumberFormatException e) {
                log.warn("Invalid cache-ttl configuration: {}, using 30m default", ttlConfig);
            }
        }
        this.ttl = Duration.ofMinutes(minutes);

        // Thread-safe access-ordered LinkedHashMap for LRU caching
        this.cache = Collections.synchronizedMap(new LinkedHashMap<String, CacheEntry>(maxCacheSize, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, CacheEntry> eldest) {
                if (size() > maxCacheSize) {
                    log.debug("Cache size reached limit of {}. Evicting oldest entry: {}", maxCacheSize, eldest.getKey());
                    return true;
                }
                return false;
            }
        });
    }

    @Override
    public GeocodingResponse reverseGeocode(double latitude, double longitude) {
        String cacheKey = buildCacheKey(latitude, longitude);
        long startTime = System.currentTimeMillis();

        CacheEntry cached = cache.get(cacheKey);
        if (cached != null) {
            if (!cached.isExpired()) {
                log.debug("Cache HIT for key: {}. Response time: {}ms", cacheKey, (System.currentTimeMillis() - startTime));
                // Return a copy to avoid external modification of cached entry
                GeocodingResponse.GeocodingAddress addressCopy = GeocodingResponse.GeocodingAddress.builder()
                        .displayName(cached.address.getDisplayName())
                        .road(cached.address.getRoad())
                        .houseNumber(cached.address.getHouseNumber())
                        .suburb(cached.address.getSuburb())
                        .neighbourhood(cached.address.getNeighbourhood())
                        .city(cached.address.getCity())
                        .postcode(cached.address.getPostcode())
                        .state(cached.address.getState())
                        .country(cached.address.getCountry())
                        .build();
                return GeocodingResponse.builder()
                        .success(true)
                        .address(addressCopy)
                        .build();
            } else {
                log.debug("Cache EXPIRED for key: {}", cacheKey);
                cache.remove(cacheKey);
            }
        } else {
            log.debug("Cache MISS for key: {}", cacheKey);
        }

        try {
            GeocodingResponse.GeocodingAddress rawAddress = geocodingProvider.reverse(latitude, longitude);
            
            // Normalize city name
            String normalizedCity = normalizeCity(rawAddress.getCity());
            rawAddress.setCity(normalizedCity);

            // Put in cache
            cache.put(cacheKey, new CacheEntry(rawAddress, ttl));

            log.debug("API Request SUCCESS. Response time: {}ms", (System.currentTimeMillis() - startTime));
            return GeocodingResponse.builder()
                    .success(true)
                    .address(rawAddress)
                    .build();

        } catch (Exception e) {
            log.error("Geocoding service error: {}", e.getMessage(), e);
            String errorType = determineErrorType(e);
            return GeocodingResponse.builder()
                    .success(false)
                    .errorType(errorType)
                    .errorMessage(e.getMessage())
                    .build();
        }
    }

    @Override
    public void clearCache() {
        log.debug("Clearing geocoding cache. Size before clear: {}", cache.size());
        cache.clear();
    }

    @Override
    public long getCacheSize() {
        return cache.size();
    }

    private String buildCacheKey(double lat, double lng) {
        return String.format("%.5f,%.5f", lat, lng);
    }

    private String stripAccents(String input) {
        if (input == null) return null;
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized).replaceAll("");
    }

    private String normalizeCity(String city) {
        if (city == null) return null;
        String clean = city.trim();
        String upperNoAccents = stripAccents(clean).toUpperCase();
        
        if (upperNoAccents.contains("TANGIER") || upperNoAccents.contains("TANGER")) {
            return "TANGER";
        }
        if (upperNoAccents.contains("TETOUAN")) {
            return "TETOUAN";
        }
        if (upperNoAccents.contains("AL HOCEIMA")) {
            return "AL HOCEIMA";
        }
        if (upperNoAccents.contains("MARRAKESH") || upperNoAccents.contains("MARRAKECH")) {
            return "MARRAKECH";
        }
        if (upperNoAccents.contains("MDIQ")) {
            return "MDIQ";
        }
        if (upperNoAccents.contains("FNIDEQ")) {
            return "FNIDEQ";
        }
        if (upperNoAccents.contains("CHAOUEN") || upperNoAccents.contains("CHEFCHAOUEN")) {
            return "CHAOUEN";
        }
        
        return clean;
    }

    private String determineErrorType(Exception e) {
        Throwable cause = e.getCause() != null ? e.getCause() : e;
        if (cause instanceof TimeoutException || e instanceof TimeoutException) {
            return "TIMEOUT";
        }
        if (cause instanceof WebClientResponseException) {
            WebClientResponseException ex = (WebClientResponseException) cause;
            int code = ex.getStatusCode().value();
            if (code == 429) {
                return "RATE_LIMIT";
            }
            if (code >= 500) {
                return "NETWORK_ERROR";
            }
            return "INVALID_RESPONSE";
        }
        if (cause instanceof java.io.IOException) {
            return "NETWORK_ERROR";
        }
        return "INVALID_RESPONSE";
    }
}
