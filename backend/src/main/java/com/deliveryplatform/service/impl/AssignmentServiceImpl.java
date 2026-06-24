package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.exception.BusinessException;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.repository.DriverRepository;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.service.AssignmentService;
import com.deliveryplatform.service.NotificationService;
import com.deliveryplatform.service.RouteOptimisationService;
import com.deliveryplatform.service.WebSocketEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssignmentServiceImpl implements AssignmentService {

    private final OrderRepository orderRepository;
    private final DriverRepository driverRepository;
    private final RouteOptimisationService routeOptimisationService;
    private final NotificationService notificationService;
    private final WebSocketEventService wsEventService;
    private final com.deliveryplatform.mapper.OrderMapper orderMapper;

    private static final double MAX_SEARCH_RADIUS_KM = 25.0;

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void autoAssignDriver(java.util.UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() != OrderStatus.PENDING) {
            log.info("Order {} is already {} (not WAITING_FOR_DRIVER). Skipping.", orderId, order.getStatus());
            return;
        }

        // Fetch available drivers with PESSIMISTIC_WRITE lock
        List<Driver> availableDrivers = driverRepository.findAvailableDriversForDispatch();
        
        if (availableDrivers.isEmpty()) {
            log.warn("Dispatch: No available drivers found for Order {}", orderId);
            return;
        }

        Driver nearestDriver = findNearestDriverWithinRadius(order, availableDrivers, MAX_SEARCH_RADIUS_KM);
        
        if (nearestDriver != null) {
            log.info("Dispatch: Sending mission offer for Order {} to Driver {}", orderId, nearestDriver.getId());
            notificationService.sendOrderOffer(nearestDriver.getUser().getId(), order);
        } else {
            log.warn("Dispatch: No drivers found within {}km for Order {}", MAX_SEARCH_RADIUS_KM, orderId);
        }
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void manualAssignDriver(java.util.UUID orderId, UUID driverId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        
        // Manual assignment also locks the driver
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));

        if (driver.getAvailability() != DriverAvailability.AVAILABLE) {
            throw new BusinessException("Driver is currently " + driver.getAvailability());
        }

        performSecureAssignment(order, driver);
    }

    @Override
    @Transactional
    public void batchAssignOptimized() {
        log.info("Triggering batch optimized assignment...");
        routeOptimisationService.performGlobalBatchOptimization();
    }

    private void performSecureAssignment(Order order, Driver driver) {
        driver.setAvailability(DriverAvailability.BUSY);
        order.setDriver(driver);
        order.setStatus(OrderStatus.ASSIGNED);
        order.setAssignedAt(LocalDateTime.now());
        
        driverRepository.save(driver);
        Order saved = orderRepository.save(order);
        log.info("Dispatch SUCCESS: Order {} assigned to Driver {}", order.getId(), driver.getId());

        // Realtime: Broadcast assignment to admin, order watchers, and notify driver
        wsEventService.broadcastOrderUpdate(saved.getId(), orderMapper.toResponse(saved));
        wsEventService.broadcastDriverStatusChange(driver.getId(), "BUSY", null);
        if (driver.getUser() != null) {
            wsEventService.sendUserNotification(driver.getUser().getId(), java.util.Map.of(
                    "type", "ORDER_ASSIGNED",
                    "message", "Nouvelle mission assign\u00e9e : " + order.getTrackingNumber(),
                    "orderId", order.getId().toString(),
                    "timestamp", LocalDateTime.now().toString()));
        }
    }

    private Driver findNearestDriverWithinRadius(Order order, List<Driver> drivers, double radiusLimit) {
        Driver bestMatch = null;
        double minDistance = Double.MAX_VALUE;

        for (Driver driver : drivers) {
            if (driver.getLatitude() == null || driver.getLongitude() == null) continue;

            double distance = calculateHaversine(
                order.getPickupLat(), order.getPickupLng(),
                driver.getLatitude(), driver.getLongitude()
            );

            if (distance <= radiusLimit && distance < minDistance) {
                minDistance = distance;
                bestMatch = driver;
            }
        }
        return bestMatch;
    }

    private double calculateHaversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
