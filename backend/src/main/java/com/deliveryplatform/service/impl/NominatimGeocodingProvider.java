package com.deliveryplatform.service.impl;

import com.deliveryplatform.dto.response.GeocodingResponse;
import com.deliveryplatform.dto.response.NominatimResponse;
import com.deliveryplatform.service.GeocodingProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import jakarta.annotation.PostConstruct;
import java.time.Duration;

@Component
@Slf4j
public class NominatimGeocodingProvider implements GeocodingProvider {

    @Autowired
    private WebClient.Builder webClientBuilder;

    @Value("${geocoding.timeout:10s}")
    private String timeoutConfig;

    private WebClient webClient;
    private Duration timeout;

    @PostConstruct
    public void init() {
        this.webClient = webClientBuilder
                .baseUrl("https://nominatim.openstreetmap.org")
                .defaultHeader("User-Agent", "CargoLink")
                .defaultHeader("Accept", "application/json")
                .build();
        
        long seconds = 10;
        if (timeoutConfig != null && timeoutConfig.endsWith("s")) {
            try {
                seconds = Long.parseLong(timeoutConfig.substring(0, timeoutConfig.length() - 1));
            } catch (NumberFormatException e) {
                log.warn("Invalid geocoding timeout configuration: {}, using 10s default", timeoutConfig);
            }
        }
        this.timeout = Duration.ofSeconds(seconds);
    }

    @Override
    public GeocodingResponse.GeocodingAddress reverse(double latitude, double longitude) {
        log.debug("Calling Nominatim reverse API for lat: {}, lon: {}", latitude, longitude);
        
        NominatimResponse response;
        try {
            response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/reverse")
                            .queryParam("format", "jsonv2")
                            .queryParam("lat", latitude)
                            .queryParam("lon", longitude)
                            .build())
                    .retrieve()
                    .bodyToMono(NominatimResponse.class)
                    .timeout(timeout)
                    .retryWhen(Retry.max(1)
                            .filter(this::isRetryableException)
                            .doBeforeRetry(retrySignal -> log.warn("Retrying Nominatim API call due to failure: {}", retrySignal.failure().getMessage()))
                    )
                    .block();
        } catch (Exception e) {
            log.error("Nominatim geocoding request failed: {}", e.getMessage());
            throw e;
        }

        if (response == null || response.getAddress() == null) {
            throw new RuntimeException("Empty or invalid response from Nominatim");
        }

        NominatimResponse.Address addr = response.getAddress();
        
        // City selection strategy (city || town || village)
        String cityVal = addr.getCity();
        if (cityVal == null || cityVal.isEmpty()) {
            cityVal = addr.getTown();
        }
        if (cityVal == null || cityVal.isEmpty()) {
            cityVal = addr.getVillage();
        }
        if (cityVal == null || cityVal.isEmpty()) {
            cityVal = addr.getMunicipality();
        }

        // Suburb selection strategy (suburb || neighbourhood || quarter)
        String suburbVal = addr.getSuburb();
        if (suburbVal == null || suburbVal.isEmpty()) {
            suburbVal = addr.getNeighbourhood();
        }
        if (suburbVal == null || suburbVal.isEmpty()) {
            suburbVal = addr.getQuarter();
        }

        return GeocodingResponse.GeocodingAddress.builder()
                .displayName(response.getDisplayName())
                .road(addr.getRoad())
                .houseNumber(addr.getHouseNumber())
                .suburb(suburbVal)
                .neighbourhood(addr.getNeighbourhood())
                .city(cityVal)
                .postcode(addr.getPostcode())
                .state(addr.getState())
                .country(addr.getCountry())
                .build();
    }

    private boolean isRetryableException(Throwable throwable) {
        if (throwable instanceof WebClientResponseException) {
            WebClientResponseException ex = (WebClientResponseException) throwable;
            int code = ex.getStatusCode().value();
            // Do not retry 400, 404, 429, or 500
            return code != 400 && code != 404 && code != 429 && code != 500;
        }
        return true;
    }
}
