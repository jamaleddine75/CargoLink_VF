package com.deliveryplatform.service;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FinancialCalculationTest {

    @Test
    void shouldCalculateDeliveryFeeWithPrecision() {
        // Given
        BigDecimal distance = BigDecimal.valueOf(12.55); // 12.55 km
        BigDecimal baseFee = BigDecimal.valueOf(30.0);
        BigDecimal perKmRate = BigDecimal.valueOf(2.0);

        // When (Calculation logic from OrderServiceImpl)
        BigDecimal calculatedFee = baseFee.add(distance.multiply(perKmRate))
                .setScale(2, RoundingMode.HALF_UP);

        // Then: 30.0 + (12.55 * 2.0) = 30.0 + 25.10 = 55.10
        assertEquals(new BigDecimal("55.10"), calculatedFee);
    }

    @Test
    void shouldApplySurgeBonusWithPrecision() {
        // Given
        BigDecimal currentFee = new BigDecimal("55.10");
        BigDecimal surgeRate = new BigDecimal("0.10"); // 10%

        // When
        BigDecimal surgeBonus = currentFee.multiply(surgeRate);
        BigDecimal totalFee = currentFee.add(surgeBonus).setScale(2, RoundingMode.HALF_UP);

        // Then: 55.10 * 0.10 = 5.51. 55.10 + 5.51 = 60.61
        assertEquals(new BigDecimal("60.61"), totalFee);
    }
    
    @Test
    void shouldHandleRoundingCorrectly() {
        // Given: Fee that would result in many decimals
        BigDecimal base = new BigDecimal("30.0");
        BigDecimal distance = new BigDecimal("1.11111");
        BigDecimal rate = new BigDecimal("2.0");
        
        // When
        BigDecimal result = base.add(distance.multiply(rate)).setScale(2, RoundingMode.HALF_UP);
        
        // Then: 30 + 2.22222 = 32.22222 -> 32.22
        assertEquals(new BigDecimal("32.22"), result);
    }
}
