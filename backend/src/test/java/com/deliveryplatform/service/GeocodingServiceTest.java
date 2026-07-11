package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.GeocodingResponse;
import com.deliveryplatform.service.impl.GeocodingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GeocodingServiceTest {

    @Mock
    private GeocodingProvider geocodingProvider;

    @InjectMocks
    private GeocodingServiceImpl geocodingService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(geocodingService, "ttlConfig", "30m");
        ReflectionTestUtils.setField(geocodingService, "maxCacheSize", 5);
        geocodingService.init();
    }

    @Test
    void testCacheHitAndMiss() {
        GeocodingResponse.GeocodingAddress address = GeocodingResponse.GeocodingAddress.builder()
                .displayName("Tanger, Morocco")
                .city("TANGER")
                .country("Morocco")
                .build();

        when(geocodingProvider.reverse(35.7595, -5.8340)).thenReturn(address);

        // First call - Cache Miss
        GeocodingResponse response1 = geocodingService.reverseGeocode(35.7595, -5.8340);
        assertTrue(response1.isSuccess());
        assertEquals("TANGER", response1.getAddress().getCity());

        // Second call - Cache Hit
        GeocodingResponse response2 = geocodingService.reverseGeocode(35.7595, -5.8340);
        assertTrue(response2.isSuccess());
        assertEquals("TANGER", response2.getAddress().getCity());

        // Verify provider called exactly once
        verify(geocodingProvider, times(1)).reverse(35.7595, -5.8340);
    }

    @Test
    void testCacheEvictionLRU() {
        // Prepare 6 distinct mock locations (our cache size cap is 5)
        for (int i = 1; i <= 6; i++) {
            GeocodingResponse.GeocodingAddress address = GeocodingResponse.GeocodingAddress.builder()
                    .displayName("Address " + i)
                    .city("TANGER")
                    .build();
            when(geocodingProvider.reverse(35.0 + i, -5.0)).thenReturn(address);
        }

        // Add 5 entries to fill cache
        for (int i = 1; i <= 5; i++) {
            geocodingService.reverseGeocode(35.0 + i, -5.0);
        }
        assertEquals(5, geocodingService.getCacheSize());

        // Access entry 1 to make it recently used
        geocodingService.reverseGeocode(36.0, -5.0); // 35.0 + 1

        // Add 6th entry - triggers eviction
        geocodingService.reverseGeocode(41.0, -5.0); // 35.0 + 6
        assertEquals(5, geocodingService.getCacheSize());

        // entry 2 (37.0, -5.0) should be evicted as it was the least recently used
        verify(geocodingProvider, times(1)).reverse(37.0, -5.0); // Called once initially
        
        // Let's call 2 again - should trigger a cache miss and call provider again
        geocodingService.reverseGeocode(37.0, -5.0);
        verify(geocodingProvider, times(2)).reverse(37.0, -5.0);
    }

    @Test
    void testCityNormalization() {
        GeocodingResponse.GeocodingAddress address1 = GeocodingResponse.GeocodingAddress.builder().city("Tangier").build();
        GeocodingResponse.GeocodingAddress address2 = GeocodingResponse.GeocodingAddress.builder().city("tétouan").build();
        GeocodingResponse.GeocodingAddress address3 = GeocodingResponse.GeocodingAddress.builder().city("Al hoceïma").build();

        when(geocodingProvider.reverse(1, 1)).thenReturn(address1);
        when(geocodingProvider.reverse(2, 2)).thenReturn(address2);
        when(geocodingProvider.reverse(3, 3)).thenReturn(address3);

        assertEquals("TANGER", geocodingService.reverseGeocode(1, 1).getAddress().getCity());
        assertEquals("TETOUAN", geocodingService.reverseGeocode(2, 2).getAddress().getCity());
        assertEquals("AL HOCEIMA", geocodingService.reverseGeocode(3, 3).getAddress().getCity());
    }

    @Test
    void testTimeoutErrorMapping() {
        when(geocodingProvider.reverse(anyDouble(), anyDouble())).thenThrow(new RuntimeException(new TimeoutException("Timeout occurred")));

        GeocodingResponse response = geocodingService.reverseGeocode(35.0, -5.0);
        assertFalse(response.isSuccess());
        assertEquals("TIMEOUT", response.getErrorType());
    }

    @Test
    void testRateLimitErrorMapping() {
        WebClientResponseException ex = WebClientResponseException.create(
                429,
                "Too Many Requests",
                org.springframework.http.HttpHeaders.EMPTY,
                new byte[0],
                java.nio.charset.StandardCharsets.UTF_8
        );
        when(geocodingProvider.reverse(anyDouble(), anyDouble())).thenThrow(new RuntimeException(ex));

        GeocodingResponse response = geocodingService.reverseGeocode(35.0, -5.0);
        assertFalse(response.isSuccess());
        assertEquals("RATE_LIMIT", response.getErrorType());
    }
}
