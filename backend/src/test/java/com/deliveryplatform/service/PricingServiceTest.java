package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.PricingConfig;
import com.deliveryplatform.exception.BusinessException;
import com.deliveryplatform.repository.PricingConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PricingServiceTest {

    @Mock
    private PricingConfigRepository pricingConfigRepository;

    @InjectMocks
    private PricingService pricingService;

    private PricingConfig config;

    @BeforeEach
    void setUp() {
        config = PricingConfig.builder()
                .baseDeliveryFee(BigDecimal.valueOf(15.0))
                .pricePerKm(BigDecimal.valueOf(2.0))
                .distanceThresholdKm(BigDecimal.valueOf(5.0))
                .maxDeliveryFee(BigDecimal.valueOf(45.0))
                .maxServiceDistanceKm(BigDecimal.valueOf(40.0))
                .codHandlingFee(BigDecimal.valueOf(3.0))
                .urgentDeliveryFee(BigDecimal.valueOf(10.0))
                .heavyPackageFee(BigDecimal.valueOf(7.0))
                .driverPercentage(BigDecimal.valueOf(0.70))
                .driverBaseFee(BigDecimal.valueOf(8.0))
                .driverRatePerKm(BigDecimal.valueOf(1.8))
                .earningsModel(PricingConfig.EarningsModel.DISTANCE)
                .active(true)
                .build();

        when(pricingConfigRepository.findByActiveTrue()).thenReturn(Optional.of(config));
    }

    @Test
    void shouldChargeFifteenDirhamsUpToFiveKm() {
        Order order = new Order();
        order.setDistance(4.5);

        pricingService.calculatePricing(order);

        assertEquals(new BigDecimal("15.00"), order.getDeliveryFee());
    }

    @Test
    void shouldChargeTwoDirhamsPerKmAfterFiveKm() {
        Order order = new Order();
        order.setDistance(12.0);

        pricingService.calculatePricing(order);

        assertEquals(new BigDecimal("29.00"), order.getDeliveryFee());
    }

    @Test
    void shouldCapDeliveryFeeAtFortyFiveDirhams() {
        Order order = new Order();
        order.setDistance(40.0);
        order.setUrgent(true);
        order.setHeavy(true);
        order.setCodAmount(new BigDecimal("100.00"));

        pricingService.calculatePricing(order);

        assertEquals(new BigDecimal("45.00"), order.getDeliveryFee());
    }

    @Test
    void shouldRejectRoutesLongerThanFortyKm() {
        Order order = new Order();
        order.setDistance(40.1);

        BusinessException exception = assertThrows(BusinessException.class, () -> pricingService.calculatePricing(order));

        assertEquals("Delivery distance cannot exceed 40 km.", exception.getMessage());
    }
}
