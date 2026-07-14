package com.deliveryplatform.service.finance.impl;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.finance.DriverFinancialEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverFinancialEngineImpl implements DriverFinancialEngine {

    private final OrderRepository orderRepository;
    private final DriverRepository driverRepository;

    @Override
    @Transactional(readOnly = true)
    public Map<String, BigDecimal> calculateDriverBalanceMetrics(UUID driverId) {
        log.info("Calculating driver balance metrics for driver: {}", driverId);
        
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + driverId));

        // Get delivered orders for driver
        List<Order> orders = orderRepository.findByDriverIdAndStatusIn(driverId, List.of(OrderStatus.DELIVERED));

        BigDecimal cashCollected = BigDecimal.ZERO;
        BigDecimal merchantFunds = BigDecimal.ZERO;
        BigDecimal deliveryFeesCollected = BigDecimal.ZERO;
        BigDecimal driverEarnings = BigDecimal.ZERO;
        BigDecimal platformCommission = BigDecimal.ZERO;

        for (Order o : orders) {
            BigDecimal cod = o.getCodAmount() != null ? o.getCodAmount() : BigDecimal.ZERO;
            BigDecimal fee = o.getDeliveryFee() != null ? o.getDeliveryFee() : BigDecimal.ZERO;
            BigDecimal earn = o.getDriverEarnings() != null ? o.getDriverEarnings() : BigDecimal.ZERO;

            cashCollected = cashCollected.add(cod).add(fee);
            merchantFunds = merchantFunds.add(cod);
            deliveryFeesCollected = deliveryFeesCollected.add(fee);
            driverEarnings = driverEarnings.add(earn);
            platformCommission = platformCommission.add(fee.subtract(earn));
        }

        Map<String, BigDecimal> metrics = new HashMap<>();
        metrics.put("cashCollected", cashCollected);
        metrics.put("merchantFunds", merchantFunds);
        metrics.put("deliveryFeesCollected", deliveryFeesCollected);
        metrics.put("driverEarnings", driverEarnings);
        metrics.put("platformCommission", platformCommission);
        metrics.put("cashInHand", cashCollected);
        metrics.put("amountOwedToPlatform", cashCollected);
        metrics.put("pendingSettlement", cashCollected);
        metrics.put("completedSettlement", BigDecimal.ZERO);

        return metrics;
    }
}
