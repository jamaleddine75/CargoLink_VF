package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.Driver;
import com.deliveryplatform.domain.entity.DriverShift;
import com.deliveryplatform.dto.response.*;
import com.deliveryplatform.repository.DriverRepository;
import com.deliveryplatform.repository.DriverShiftRepository;
import com.deliveryplatform.repository.DriverBadgeRepository;
import com.deliveryplatform.service.ShiftService;
import com.deliveryplatform.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShiftServiceImpl implements ShiftService {

    private final DriverShiftRepository shiftRepository;
    private final DriverBadgeRepository badgeRepository;
    private final DriverRepository driverRepository;
    private final com.deliveryplatform.repository.OrderRepository orderRepository;

    @Override
    @Transactional
    public ShiftSummaryResponse startShift(UUID userId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "userId", userId));
        DriverShift shift = getOrCreateActiveShift(driver);
        return mapToSummary(shift);
    }

    @Override
    @Transactional
    public ShiftSummaryResponse getCurrentShift(UUID userId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "userId", userId));
        DriverShift shift = getOrCreateActiveShift(driver);

        return mapToSummary(shift);
    }

    @Override
    @Transactional
    public void endShift(String shiftId, UUID userId) {
        DriverShift shift = shiftRepository.findById(UUID.fromString(shiftId))
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", shiftId));

        shift.setActive(false);
        shift.setEndedAt(LocalDateTime.now());
        shiftRepository.save(shift);
        log.info("Shift {} ended for user {}", shiftId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public WeeklyPerformanceResponse getWeeklyPerformance(UUID userId) {
        // Mocked implementation for demo
        return WeeklyPerformanceResponse.builder()
                .totalEarnings(1250.50)
                .totalDeliveries(45)
                .avgSuccessRate(98.5)
                .rank(3)
                .totalDrivers(25)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverBadgeResponse> getBadges(UUID userId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "userId", userId));

        return badgeRepository.findByDriverIdOrderByEarnedAtDesc(driver.getId())
                .stream()
                .map(badge -> DriverBadgeResponse.builder()
                        .name(badge.getName())
                        .description(badge.getDescription())
                        .icon(badge.getIcon())
                        .type(badge.getBadgeType().name())
                        .earnedAt(badge.getEarnedAt().toString())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftGoalResponse> getShiftGoals(UUID userId) {
        List<ShiftGoalResponse> goals = new ArrayList<>();
        goals.add(ShiftGoalResponse.builder()
                .label("Deliveries")
                .current(8)
                .target(12)
                .unit("orders")
                .pct(66)
                .build());
        goals.add(ShiftGoalResponse.builder()
                .label("Earnings")
                .current(150.0)
                .target(250.0)
                .unit("MAD")
                .pct(60)
                .build());
        return goals;
    }

    @Override
    @Transactional
    public void recordDelivery(UUID userId, java.math.BigDecimal earnings, java.math.BigDecimal cod, double distance) {
        Driver driver = driverRepository.findByUserId(userId).orElse(null);
        if (driver == null) return;
        
        DriverShift shift = getOrCreateActiveShift(driver);
        shift.setTotalDeliveries((shift.getTotalDeliveries() != null ? shift.getTotalDeliveries() : 0) + 1);
        shift.setSuccessfulDeliveries((shift.getSuccessfulDeliveries() != null ? shift.getSuccessfulDeliveries() : 0) + 1);
        
        if (earnings != null) {
            shift.setTotalEarnings((shift.getTotalEarnings() != null ? shift.getTotalEarnings() : java.math.BigDecimal.ZERO).add(earnings));
        }
        if (cod != null) {
            shift.setTotalCod((shift.getTotalCod() != null ? shift.getTotalCod() : java.math.BigDecimal.ZERO).add(cod));
        }
        if (distance > 0) {
            shift.setTotalDistanceKm((shift.getTotalDistanceKm() != null ? shift.getTotalDistanceKm() : java.math.BigDecimal.ZERO).add(java.math.BigDecimal.valueOf(distance)));
        }
        
        shiftRepository.save(shift);
        log.info("Recorded successful delivery for driver {} in shift {}", driver.getId(), shift.getId());
    }

    @Override
    @Transactional
    public void recordFailure(UUID userId) {
        Driver driver = driverRepository.findByUserId(userId).orElse(null);
        if (driver == null) return;
        
        DriverShift shift = getOrCreateActiveShift(driver);
        shift.setTotalDeliveries((shift.getTotalDeliveries() != null ? shift.getTotalDeliveries() : 0) + 1);
        shift.setFailedDeliveries((shift.getFailedDeliveries() != null ? shift.getFailedDeliveries() : 0) + 1);
        
        shiftRepository.save(shift);
        log.info("Recorded failed delivery for driver {} in shift {}", driver.getId(), shift.getId());
    }

    private DriverShift getOrCreateActiveShift(Driver driver) {
        return shiftRepository.findByDriverIdAndIsActiveTrue(driver.getId())
                .orElseGet(() -> {
                    log.info("Starting new shift for driver {}", driver.getId());
                    LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
                    
                    // Initialize with today's stats for better UX
                    long todayDelivered = 0;
                    java.math.BigDecimal todayEarnings = java.math.BigDecimal.ZERO;
                    java.math.BigDecimal todayCod = java.math.BigDecimal.ZERO;
                    
                    try {
                        todayDelivered = orderRepository.countByDriverIdAndStatusAndDeliveredAtAfter(driver.getId(), com.deliveryplatform.domain.entity.OrderStatus.DELIVERED, todayStart);
                        todayEarnings = orderRepository.sumDriverEarningsByDriverIdAndStatusAndDeliveredAtAfter(driver.getId(), com.deliveryplatform.domain.entity.OrderStatus.DELIVERED, todayStart);
                        todayCod = orderRepository.sumTotalCodByDriverIdAndStatus(driver.getId(), com.deliveryplatform.domain.entity.OrderStatus.DELIVERED, false);
                    } catch (Exception e) {
                        log.warn("Failed to initialize shift with today's stats: {}", e.getMessage());
                    }

                    return shiftRepository.save(DriverShift.builder()
                            .driver(driver)
                            .startedAt(LocalDateTime.now())
                            .isActive(true)
                            .totalDeliveries((int)todayDelivered)
                            .successfulDeliveries((int)todayDelivered)
                            .totalEarnings(todayEarnings != null ? todayEarnings : java.math.BigDecimal.ZERO)
                            .totalCod(todayCod != null ? todayCod : java.math.BigDecimal.ZERO)
                            .build());
                });
    }

    private ShiftSummaryResponse mapToSummary(DriverShift shift) {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        java.math.BigDecimal totalEarnings = shift.getTotalEarnings() != null ? shift.getTotalEarnings() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalCod = shift.getTotalCod() != null ? shift.getTotalCod() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalDistanceKm = shift.getTotalDistanceKm() != null ? shift.getTotalDistanceKm() : java.math.BigDecimal.ZERO;

        return ShiftSummaryResponse.builder()
                .shiftId(shift.getId().toString())
                .startedAt(shift.getStartedAt().format(formatter))
                .endedAt(shift.getEndedAt() != null ? shift.getEndedAt().format(formatter) : null)
                .isActive(shift.isActive())
                .totalDeliveries(shift.getTotalDeliveries() != null ? shift.getTotalDeliveries() : 0)
                .successfulDeliveries(shift.getSuccessfulDeliveries() != null ? shift.getSuccessfulDeliveries() : 0)
                .failedDeliveries(shift.getFailedDeliveries() != null ? shift.getFailedDeliveries() : 0)
                .totalEarnings(totalEarnings.doubleValue())
                .totalCOD(totalCod.doubleValue())
                .totalDistanceKm(totalDistanceKm.doubleValue())
                .avgDeliveryTimeMin(shift.getAvgDeliveryTimeMin() != null ? shift.getAvgDeliveryTimeMin() : 0)
                .slaBreaches(shift.getSlaBreaches() != null ? shift.getSlaBreaches() : 0)
                .incidentCount(shift.getIncidentCount() != null ? shift.getIncidentCount() : 0)
                .build();
    }
}
