package com.deliveryplatform.service.impl;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import com.deliveryplatform.dto.response.DriverResponse;
import com.deliveryplatform.dto.response.DriverDashboardStatsResponse;
import com.deliveryplatform.dto.response.DriverStatsResponse;
import com.deliveryplatform.dto.request.UpdateDriverProfileRequest;
import com.deliveryplatform.domain.entity.Driver;
import com.deliveryplatform.domain.entity.DriverStatus;
import com.deliveryplatform.domain.entity.OrderStatus;
import com.deliveryplatform.domain.entity.DriverAvailability;
import com.deliveryplatform.repository.DriverRepository;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.mapper.DriverMapper;
import com.deliveryplatform.service.DriverService;
import com.deliveryplatform.exception.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DriverServiceImpl implements DriverService {
    private final DriverRepository driverRepository;
    private final OrderRepository orderRepository;
    private final DriverMapper driverMapper;
    private final com.deliveryplatform.service.WalletService walletService;
    private final com.deliveryplatform.service.WebSocketEventService wsEventService;

    @Override
    public DriverResponse getDriverProfile(UUID userId) {
        return driverRepository.findByUserId(userId)
                .map(driverMapper::toResponse)
                .orElseGet(() -> {
                    log.warn("Driver profile not found for user {}. Returning basic info.", userId);
                    DriverResponse shallow = new DriverResponse();
                    shallow.setDriverStatus("OFFLINE");
                    shallow.setVerificationStatus("PENDING");
                    return shallow;
                });
    }

    @Override
    public DriverResponse getDriverById(UUID id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", id.toString()));
        return driverMapper.toResponse(driver);
    }

    @Override
    public DriverResponse updateDriverProfile(UUID userId, UpdateDriverProfileRequest request) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "userId", userId));
        
        if (request.getFirstName() != null) {
            driver.getUser().setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            driver.getUser().setLastName(request.getLastName());
        }
        if (request.getPhoneNumber() != null) {
            driver.getUser().setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getVehiclePlate() != null) {
            driver.setVehiclePlate(request.getVehiclePlate());
        }
        if (request.getLicenseNumber() != null) {
            driver.setLicenseNumber(request.getLicenseNumber());
        }

        if (request.getDocuments() != null) {
            driver.setDocuments(request.getDocuments());
        }

        Driver saved = driverRepository.save(driver);
        return driverMapper.toResponse(saved);
    }

    @Override
    public DriverResponse updateDriverStatus(java.util.UUID driverId, String status) {
        if (status == null) {
            throw new com.deliveryplatform.exception.BusinessException("Status cannot be null");
        }
        
        Driver driver = driverRepository.findById(driverId)
                .or(() -> driverRepository.findByUserId(driverId))
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id/userId", driverId));
                
        try {
            DriverStatus driverStatus = DriverStatus.valueOf(status.toUpperCase());
            driver.setStatus(driverStatus);
            log.info("Driver {} status updated to {}", driver.getId(), driverStatus);
        } catch (IllegalArgumentException e1) {
            try {
                DriverAvailability availability = DriverAvailability.valueOf(status.toUpperCase());
                driver.setAvailability(availability);
                log.info("Driver {} availability updated to {}", driver.getId(), availability);
            } catch (IllegalArgumentException e2) {
                throw new com.deliveryplatform.exception.BusinessException("Invalid driver status or availability: " + status);
            }
        }
        
        Driver saved = driverRepository.save(driver);

        // Realtime: Broadcast driver status change to admin route monitor
        DriverResponse driverResponse = driverMapper.toResponse(saved);
        String effectiveStatus = saved.getStatus() != null ? saved.getStatus().name() : 
                (saved.getAvailability() != null ? saved.getAvailability().name() : "UNKNOWN");
        wsEventService.broadcastDriverStatusChange(saved.getId(), effectiveStatus, driverResponse);

        return driverResponse;
    }

    @Override
    public List<DriverResponse> getAllDrivers() {
        return driverRepository.findAll().stream()
                .map(driverMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DriverStatsResponse getDriverStats(UUID userId, String period) {
        Optional<Driver> driverOpt = driverRepository.findByUserId(userId);
        if (driverOpt.isEmpty()) {
            return DriverStatsResponse.builder()
                .totalOrders(0).completedOrders(0).totalEarnings(java.math.BigDecimal.ZERO)
                .averageRating(4.8).successRate(100.0).pendingCOD(java.math.BigDecimal.ZERO)
                .weeklyCommission(java.math.BigDecimal.ZERO).build();
        }
        
        Driver driver = driverOpt.get();
        UUID did = driver.getId();
        
        try {
            long totalOrders = orderRepository.countByDriverId(did);
            long completed = orderRepository.countByDriverIdAndStatus(did, OrderStatus.DELIVERED);
            java.math.BigDecimal pendingCod = orderRepository.sumTotalCodByDriverIdAndStatus(did, OrderStatus.DELIVERED, false);
            if (pendingCod == null) pendingCod = java.math.BigDecimal.ZERO;

            java.math.BigDecimal weeklyCommission = walletService.getDriverBalance(userId).getWeeklyCommission();
            java.math.BigDecimal totalEarnings = orderRepository.sumDriverEarningsByDriverIdAndStatus(did, OrderStatus.DELIVERED);
            if (totalEarnings == null) totalEarnings = java.math.BigDecimal.ZERO;

            int failedToday = (int) orderRepository.countByDriverIdAndStatusAndCreatedAtAfter(did, OrderStatus.FAILED, LocalDateTime.now().toLocalDate().atStartOfDay());

            return DriverStatsResponse.builder()
                    .totalOrders((int) totalOrders)
                    .completedOrders((int) completed)
                    .totalEarnings(totalEarnings)
                    .averageRating(driver.getRating() != null ? driver.getRating() : 4.8)
                    .successRate(totalOrders > 0 ? (completed * 100.0 / totalOrders) : 100.0)
                    .pendingCOD(pendingCod)
                    .weeklyCommission(weeklyCommission)
                    .todayFailed(failedToday)
                    .build();
        } catch (Exception e) {
            log.error("Error calculating driver stats: {}", e.getMessage());
            return DriverStatsResponse.builder()
                .totalOrders(0).completedOrders(0).totalEarnings(java.math.BigDecimal.ZERO)
                .averageRating(4.8).successRate(100.0).pendingCOD(java.math.BigDecimal.ZERO).build();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public DriverDashboardStatsResponse getDriverDashboard(UUID userId) {
        try {
            Optional<Driver> driverOpt = driverRepository.findByUserId(userId);
            if (driverOpt.isEmpty()) {
                return DriverDashboardStatsResponse.builder()
                        .todayDelivered(0).todayEarnings(java.math.BigDecimal.ZERO)
                        .successRate(100.0).isOnline(false).verificationStatus("PENDING")
                        .earnings(java.math.BigDecimal.ZERO).completedToday(0).build();
            }
            
            Driver driver = driverOpt.get();
            UUID did = driver.getId();
            LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();

            // ── Delivered count (by deliveredAt, not createdAt) ──────────────
            int deliveredToday = 0;
            try {
                deliveredToday = (int) orderRepository.countByDriverIdAndStatusAndDeliveredAtAfter(did, OrderStatus.DELIVERED, todayStart);
            } catch (Exception e) { log.warn("Dashboard: deliveredToday query failed: {}", e.getMessage()); }

            // ── Earnings today 
            java.math.BigDecimal earningsToday = java.math.BigDecimal.ZERO;
            try {
                earningsToday = walletService.getDailyEarnings(userId);
            } catch (Exception e) {
                log.warn("Wallet service fetch failed, falling back to repository for dashboard earnings");
                java.math.BigDecimal fromOrders = orderRepository.sumDriverEarningsByDriverIdAndStatusAndDeliveredAtAfter(did, OrderStatus.DELIVERED, todayStart);
                earningsToday = fromOrders != null ? fromOrders : java.math.BigDecimal.ZERO;
            }

            // ── COD pending ───────────────────────────────────────────────────
            java.math.BigDecimal pendingCod = java.math.BigDecimal.ZERO;
            try {
                java.math.BigDecimal raw = orderRepository.sumTotalCodByDriverIdAndStatus(did, OrderStatus.DELIVERED, false);
                if (raw != null) pendingCod = raw;
            } catch (Exception e) { log.warn("Dashboard: pendingCod query failed: {}", e.getMessage()); }

            // ── Success rate ──────────────────────────────────────────────────
            double successRate = 100.0;
            try {
                long totalToday = orderRepository.countByDriverIdAndCreatedAtAfter(did, todayStart);
                if (totalToday > 0) successRate = (deliveredToday * 100.0) / totalToday;
            } catch (Exception e) { log.warn("Dashboard: successRate query failed: {}", e.getMessage()); }

            // ── Active orders ─────────────────────────────────────────────────
            int activeCount = 0;
            try {
                activeCount = (int) orderRepository.countByDriverIdAndStatusIn(did, Arrays.asList(
                        OrderStatus.ASSIGNED, OrderStatus.PICKUP_READY, OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY));
            } catch (Exception e) { log.warn("Dashboard: activeCount query failed: {}", e.getMessage()); }

            // ── Failed today (use deliveredAt-equivalent for failed) ──────────
            int failedToday = 0;
            try {
                failedToday = (int) orderRepository.countByDriverIdAndStatusAndCreatedAtAfter(did, OrderStatus.FAILED, todayStart);
            } catch (Exception e) { log.warn("Dashboard: failedToday query failed: {}", e.getMessage()); }

            // ── Last order earnings (driverEarnings field) ────────────────────
            java.math.BigDecimal lastEarnings = java.math.BigDecimal.ZERO;
            try {
                lastEarnings = orderRepository.findFirstByDriverIdAndStatusInOrderByCreatedAtDesc(did, List.of(OrderStatus.DELIVERED))
                        .map(com.deliveryplatform.domain.entity.Order::getDriverEarnings)
                        .orElse(java.math.BigDecimal.ZERO);
                if (lastEarnings == null) lastEarnings = java.math.BigDecimal.ZERO;
            } catch (Exception e) { log.warn("Dashboard: lastEarnings query failed: {}", e.getMessage()); }

            // ── Weekly commission — isolated so a wallet error doesn't zero dashboard ──
            java.math.BigDecimal weeklyCommission = java.math.BigDecimal.ZERO;
            try {
                com.deliveryplatform.dto.response.WalletResponse w = walletService.getDriverBalance(userId);
                if (w != null && w.getWeeklyCommission() != null) weeklyCommission = w.getWeeklyCommission();
            } catch (Exception e) { log.warn("Dashboard: weeklyCommission fetch failed: {}", e.getMessage()); }

            return DriverDashboardStatsResponse.builder()
                    .todayDelivered(deliveredToday)
                    .todayEarnings(earningsToday)
                    .todayFailed(failedToday)
                    .lastOrderEarnings(lastEarnings)
                    .earningsTrend("Stable")
                    .pendingCOD(pendingCod)
                    .weeklyCommission(weeklyCommission)
                    .successRate(successRate)
                    .activeOrderCount(activeCount)
                    .isOnline(driver.getStatus() == DriverStatus.ONLINE)
                    .isOnShift(driver.getStatus() == DriverStatus.ONLINE)
                    .verificationStatus(driver.getVerificationStatus() != null ? driver.getVerificationStatus().name() : "APPROVED")
                    .loyaltyPoints(driver.getLoyaltyPoints())
                    .completedToday(deliveredToday)
                    .earnings(earningsToday)
                    .build();
        } catch (Exception e) {
            log.error("Dashboard total failure: {}", e.getMessage());
            return DriverDashboardStatsResponse.builder()
                    .todayDelivered(0).todayEarnings(java.math.BigDecimal.ZERO)
                    .successRate(100.0).isOnline(false).verificationStatus("PENDING")
                    .earnings(java.math.BigDecimal.ZERO).completedToday(0).build();
        }
    }

    @Override
    public void assignOrder(java.util.UUID driverId, java.util.UUID orderId) {
        // Implementation if needed
    }

    @Override
    public Double getDriverEfficiency(java.util.UUID driverId) {
        long delivered = orderRepository.countByDriverIdAndStatus(driverId, OrderStatus.DELIVERED);
        long failed = orderRepository.countByDriverIdAndStatus(driverId, OrderStatus.FAILED);
        long total = delivered + failed;
        return total == 0 ? 100.0 : (delivered * 100.0) / total;
    }

    @Override
    public DriverResponse updateVehicleInfo(java.util.UUID driverId, String vehiclePlate) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));
        driver.setVehiclePlate(vehiclePlate);
        return driverMapper.toResponse(driverRepository.save(driver));
    }

    @Override
    public Boolean isDriverAvailable(java.util.UUID driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));
        return DriverAvailability.AVAILABLE.equals(driver.getAvailability());
    }

    @Override
    @Transactional(readOnly = true)
    public DriverResponse getPreferences(UUID userId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "userId", userId));
        return driverMapper.toResponse(driver);
    }

    @Override
    @Transactional
    public DriverResponse updatePreferences(UUID userId, DriverResponse prefs) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "userId", userId));
        driver.setAutoAccept(prefs.isAutoAccept());
        driver.setNotificationsEnabled(prefs.isNotifications());
        driver.setSoundEnabled(prefs.isSound());
        driver.setGoogleMapsEnabled(prefs.isGoogleMaps());
        driver.setDarkMapEnabled(prefs.isDarkMap());
        return driverMapper.toResponse(driverRepository.save(driver));
    }
}
