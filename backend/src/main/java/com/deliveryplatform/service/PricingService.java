package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.PricingConfig;
import com.deliveryplatform.exception.BusinessException;
import com.deliveryplatform.repository.PricingConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
@Slf4j
public class PricingService {

    private static final java.math.BigDecimal BASE_DELIVERY_FEE = java.math.BigDecimal.valueOf(15.0);
    private static final java.math.BigDecimal DISTANCE_THRESHOLD_KM = java.math.BigDecimal.valueOf(5.0);
    private static final java.math.BigDecimal PER_KM_RATE_AFTER_THRESHOLD = java.math.BigDecimal.valueOf(2.0);
    private static final java.math.BigDecimal MAX_DELIVERY_FEE = java.math.BigDecimal.valueOf(45.0);
    private static final java.math.BigDecimal MAX_SERVICE_DISTANCE_KM = java.math.BigDecimal.valueOf(40.0);

    private final PricingConfigRepository pricingConfigRepository;

    /**
     * Calculates the total delivery fee (Client Price) and driver earnings.
     * @param order The order entity with distance and extras set.
     */
    public void calculatePricing(Order order) {
        calculatePricing(order, null);
    }

    public void calculatePricing(Order order, Double totalWeight) {
        PricingConfig config = getCurrentConfig();

        java.math.BigDecimal distance = order.getDistance() != null ? java.math.BigDecimal.valueOf(order.getDistance()) : java.math.BigDecimal.ZERO;
        java.math.BigDecimal maxDistance = config.getMaxServiceDistanceKm() != null ? config.getMaxServiceDistanceKm() : MAX_SERVICE_DISTANCE_KM;
        validateServiceDistance(distance, maxDistance);

        // 1. Calculate Client Price using the dynamic delivery config
        java.math.BigDecimal clientPrice = calculateCoreDeliveryFee(distance, config);

        // Extras
        if (order.getCodAmount() != null && order.getCodAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            clientPrice = clientPrice.add(config.getCodHandlingFee() != null ? config.getCodHandlingFee() : java.math.BigDecimal.ZERO);
        }
        if (order.isUrgent()) {
            clientPrice = clientPrice.add(config.getUrgentDeliveryFee() != null ? config.getUrgentDeliveryFee() : java.math.BigDecimal.ZERO);
        }
        
        java.math.BigDecimal weightFee = java.math.BigDecimal.ZERO;
        if (totalWeight != null && totalWeight > 1.0) {
            double extraWeight = Math.ceil(totalWeight - 1.0);
            weightFee = java.math.BigDecimal.valueOf(extraWeight * 2.0);
        } else if (order.isHeavy() && (totalWeight == null || totalWeight <= 1.0)) {
            weightFee = config.getHeavyPackageFee() != null ? config.getHeavyPackageFee() : java.math.BigDecimal.ZERO;
        }
        clientPrice = clientPrice.add(weightFee);

        java.math.BigDecimal maxFee = config.getMaxDeliveryFee() != null ? config.getMaxDeliveryFee() : MAX_DELIVERY_FEE;
        clientPrice = clientPrice.min(maxFee)
            .setScale(0, java.math.RoundingMode.HALF_UP)
            .setScale(2, java.math.RoundingMode.HALF_UP);
        order.setDeliveryFee(clientPrice);

        // 2. Calculate Driver Earnings
        java.math.BigDecimal driverEarnings;
        if (config.getEarningsModel() == PricingConfig.EarningsModel.PERCENTAGE) {
            java.math.BigDecimal pct = config.getDriverPercentage() != null ? config.getDriverPercentage() : java.math.BigDecimal.ZERO;
            driverEarnings = clientPrice.multiply(pct).setScale(2, java.math.RoundingMode.HALF_UP);
        } else {
            java.math.BigDecimal baseDriver = config.getDriverBaseFee() != null ? config.getDriverBaseFee() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal perKmDriver = config.getDriverRatePerKm() != null ? config.getDriverRatePerKm() : java.math.BigDecimal.ZERO;
            driverEarnings = baseDriver.add(distance.multiply(perKmDriver)).setScale(2, java.math.RoundingMode.HALF_UP);
        }

        order.setDriverEarnings(driverEarnings);

        // 3. Platform Margin Validation (Business Rule)
        validateMargin(clientPrice, driverEarnings, config.getEarningsModel());
    }

    public java.util.Map<String, Object> calculateEstimate(double distance, Double codAmount, boolean urgent, boolean heavy) {
        return calculateEstimate(distance, codAmount, urgent, heavy, null);
    }

    public java.util.Map<String, Object> calculateEstimate(double distance, Double codAmount, boolean urgent, boolean heavy, Double weight) {
        PricingConfig config = getCurrentConfig();
        
        java.math.BigDecimal distanceBD = java.math.BigDecimal.valueOf(distance);
        java.math.BigDecimal maxDistance = config.getMaxServiceDistanceKm() != null ? config.getMaxServiceDistanceKm() : MAX_SERVICE_DISTANCE_KM;
        validateServiceDistance(distanceBD, maxDistance);
        java.math.BigDecimal codAmountBD = codAmount != null ? java.math.BigDecimal.valueOf(codAmount) : java.math.BigDecimal.ZERO;
        
        java.math.BigDecimal baseFee = config.getBaseDeliveryFee() != null ? config.getBaseDeliveryFee() : BASE_DELIVERY_FEE;
        java.math.BigDecimal distanceFee = calculateDistanceFee(distanceBD, config);
        java.math.BigDecimal codFee = (codAmountBD.compareTo(java.math.BigDecimal.ZERO) > 0) ? (config.getCodHandlingFee() != null ? config.getCodHandlingFee() : java.math.BigDecimal.ZERO) : java.math.BigDecimal.ZERO;
        java.math.BigDecimal urgentFee = urgent ? (config.getUrgentDeliveryFee() != null ? config.getUrgentDeliveryFee() : java.math.BigDecimal.ZERO) : java.math.BigDecimal.ZERO;
        
        java.math.BigDecimal heavyFee = java.math.BigDecimal.ZERO;
        if (weight != null && weight > 1.0) {
            double extraWeight = Math.ceil(weight - 1.0);
            heavyFee = java.math.BigDecimal.valueOf(extraWeight * 2.0);
        } else if (heavy) {
            heavyFee = config.getHeavyPackageFee() != null ? config.getHeavyPackageFee() : java.math.BigDecimal.ZERO;
        }

        java.math.BigDecimal maxFee = config.getMaxDeliveryFee() != null ? config.getMaxDeliveryFee() : MAX_DELIVERY_FEE;
        java.math.BigDecimal total = baseFee.add(distanceFee).add(codFee).add(urgentFee).add(heavyFee)
            .min(maxFee)
            .setScale(0, java.math.RoundingMode.HALF_UP)
            .setScale(2, java.math.RoundingMode.HALF_UP);
        
        return java.util.Map.of(
            "baseFee", baseFee.setScale(2, java.math.RoundingMode.HALF_UP),
            "distanceFee", distanceFee.setScale(2, java.math.RoundingMode.HALF_UP),
            "codFee", codFee.setScale(2, java.math.RoundingMode.HALF_UP),
            "urgentFee", urgentFee.setScale(2, java.math.RoundingMode.HALF_UP),
            "heavyFee", heavyFee.setScale(2, java.math.RoundingMode.HALF_UP),
            "totalFee", total,
            "maxDistanceKm", maxDistance.setScale(2, java.math.RoundingMode.HALF_UP),
            "maxFee", maxFee.setScale(2, java.math.RoundingMode.HALF_UP),
            "currency", "MAD"
        );
    }

    private void validateServiceDistance(java.math.BigDecimal distance, java.math.BigDecimal maxDistance) {
        if (distance.compareTo(maxDistance) > 0) {
            throw new BusinessException("Delivery distance cannot exceed " + maxDistance.intValue() + " km.");
        }
    }

    private java.math.BigDecimal calculateCoreDeliveryFee(java.math.BigDecimal distance, PricingConfig config) {
        java.math.BigDecimal distanceFee = calculateDistanceFee(distance, config);
        java.math.BigDecimal baseFee = config.getBaseDeliveryFee() != null ? config.getBaseDeliveryFee() : BASE_DELIVERY_FEE;
        java.math.BigDecimal maxFee = config.getMaxDeliveryFee() != null ? config.getMaxDeliveryFee() : MAX_DELIVERY_FEE;
        return baseFee.add(distanceFee).min(maxFee).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private java.math.BigDecimal calculateDistanceFee(java.math.BigDecimal distance, PricingConfig config) {
        java.math.BigDecimal threshold = config.getDistanceThresholdKm() != null ? config.getDistanceThresholdKm() : DISTANCE_THRESHOLD_KM;
        java.math.BigDecimal billableDistance = distance.subtract(threshold);
        if (billableDistance.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return java.math.BigDecimal.ZERO.setScale(2, java.math.RoundingMode.HALF_UP);
        }
        java.math.BigDecimal ratePerKm = config.getPricePerKm() != null ? config.getPricePerKm() : PER_KM_RATE_AFTER_THRESHOLD;
        return billableDistance.multiply(ratePerKm).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private void validateMargin(java.math.BigDecimal clientPrice, java.math.BigDecimal driverEarnings, PricingConfig.EarningsModel model) {
        java.math.BigDecimal platformMargin = clientPrice.subtract(driverEarnings);
        double marginPercent = clientPrice.compareTo(java.math.BigDecimal.ZERO) > 0 ?
                platformMargin.divide(clientPrice, 4, java.math.RoundingMode.HALF_UP).doubleValue() * 100.0 : 0.0;
        
        log.info("Pricing calculated: Client Price = {} MAD, Driver Earnings = {} MAD (Margin: {}%, Model: {})", 
            clientPrice, driverEarnings, String.format("%.2f", marginPercent), model);

        if (marginPercent < 20 || marginPercent > 35) {
            log.warn("BUSINESS RULE WARNING: Platform margin ({}%) is outside the recommended 20-35% range.",
                    String.format("%.2f", marginPercent));
        }
    }

    private PricingConfig createDefaultConfig() {
        log.warn("No active PricingConfig found. Using defaults.");
        PricingConfig config = PricingConfig.builder()
            .baseDeliveryFee(java.math.BigDecimal.valueOf(15.0))
            .pricePerKm(java.math.BigDecimal.valueOf(2.0))
            .distanceThresholdKm(java.math.BigDecimal.valueOf(5.0))
            .maxDeliveryFee(java.math.BigDecimal.valueOf(45.0))
            .maxServiceDistanceKm(java.math.BigDecimal.valueOf(40.0))
            .codHandlingFee(java.math.BigDecimal.valueOf(3.0))
            .urgentDeliveryFee(java.math.BigDecimal.valueOf(10.0))
            .heavyPackageFee(java.math.BigDecimal.valueOf(7.0))
            .earningsModel(PricingConfig.EarningsModel.DISTANCE)
            .driverBaseFee(java.math.BigDecimal.valueOf(8.0))
            .driverRatePerKm(java.math.BigDecimal.valueOf(1.8))
            .driverPercentage(java.math.BigDecimal.valueOf(0.70))
            .active(true)
            .build();
        return pricingConfigRepository.save(config);
    }

    public PricingConfig updateConfig(PricingConfig newConfig) {
        // Deactivate old active config
        pricingConfigRepository.findByActiveTrue().ifPresent(old -> {
            old.setActive(false);
            pricingConfigRepository.save(old);
        });
        newConfig.setActive(true);
        return pricingConfigRepository.save(newConfig);
    }
    
    public PricingConfig getCurrentConfig() {
        return pricingConfigRepository.findByActiveTrue()
                .orElseGet(this::createDefaultConfig);
    }
}
