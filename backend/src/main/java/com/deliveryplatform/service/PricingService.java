package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.PricingConfig;
import com.deliveryplatform.repository.PricingConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
@Slf4j
public class PricingService {

    private final PricingConfigRepository pricingConfigRepository;

    /**
     * Calculates the total delivery fee (Client Price) and driver earnings.
     * @param order The order entity with distance and extras set.
     */
    public void calculatePricing(Order order) {
        PricingConfig config = getCurrentConfig();

        java.math.BigDecimal distance = order.getDistance() != null ? java.math.BigDecimal.valueOf(order.getDistance()) : java.math.BigDecimal.ZERO;

        // 1. Calculate Client Price using BigDecimal
        java.math.BigDecimal base = config.getBaseDeliveryFee() != null ? config.getBaseDeliveryFee() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal perKm = config.getPricePerKm() != null ? config.getPricePerKm() : java.math.BigDecimal.ZERO;

        java.math.BigDecimal clientPrice = base.add(distance.multiply(perKm));

        // Extras
        if (order.getCodAmount() != null && order.getCodAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            clientPrice = clientPrice.add(config.getCodHandlingFee() != null ? config.getCodHandlingFee() : java.math.BigDecimal.ZERO);
        }
        if (order.isUrgent()) {
            clientPrice = clientPrice.add(config.getUrgentDeliveryFee() != null ? config.getUrgentDeliveryFee() : java.math.BigDecimal.ZERO);
        }
        if (order.isHeavy()) {
            clientPrice = clientPrice.add(config.getHeavyPackageFee() != null ? config.getHeavyPackageFee() : java.math.BigDecimal.ZERO);
        }

        clientPrice = clientPrice.setScale(2, java.math.RoundingMode.HALF_UP);
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
        PricingConfig config = getCurrentConfig();
        
        java.math.BigDecimal distanceBD = java.math.BigDecimal.valueOf(distance);
        java.math.BigDecimal codAmountBD = codAmount != null ? java.math.BigDecimal.valueOf(codAmount) : java.math.BigDecimal.ZERO;
        
        java.math.BigDecimal baseFee = config.getBaseDeliveryFee() != null ? config.getBaseDeliveryFee() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal distanceFee = distanceBD.multiply(config.getPricePerKm() != null ? config.getPricePerKm() : java.math.BigDecimal.ZERO);
        java.math.BigDecimal codFee = (codAmountBD.compareTo(java.math.BigDecimal.ZERO) > 0) ? (config.getCodHandlingFee() != null ? config.getCodHandlingFee() : java.math.BigDecimal.ZERO) : java.math.BigDecimal.ZERO;
        java.math.BigDecimal urgentFee = urgent ? (config.getUrgentDeliveryFee() != null ? config.getUrgentDeliveryFee() : java.math.BigDecimal.ZERO) : java.math.BigDecimal.ZERO;
        java.math.BigDecimal heavyFee = heavy ? (config.getHeavyPackageFee() != null ? config.getHeavyPackageFee() : java.math.BigDecimal.ZERO) : java.math.BigDecimal.ZERO;
        
        java.math.BigDecimal total = baseFee.add(distanceFee).add(codFee).add(urgentFee).add(heavyFee).setScale(2, java.math.RoundingMode.HALF_UP);
        
        return java.util.Map.of(
            "baseFee", baseFee.setScale(2, java.math.RoundingMode.HALF_UP),
            "distanceFee", distanceFee.setScale(2, java.math.RoundingMode.HALF_UP),
            "codFee", codFee.setScale(2, java.math.RoundingMode.HALF_UP),
            "urgentFee", urgentFee.setScale(2, java.math.RoundingMode.HALF_UP),
            "heavyFee", heavyFee.setScale(2, java.math.RoundingMode.HALF_UP),
            "totalFee", total,
            "currency", "MAD"
        );
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
            .baseDeliveryFee(java.math.BigDecimal.valueOf(10.0))
            .pricePerKm(java.math.BigDecimal.valueOf(2.5))
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
