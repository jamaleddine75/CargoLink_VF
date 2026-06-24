package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.OrderStatus;
import com.deliveryplatform.domain.entity.SLAStatus;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.service.ETAService;
import com.deliveryplatform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
@Slf4j
public class ETAServiceImpl implements ETAService {

    private final OrderRepository orderRepository;
    private final NotificationService notificationService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    // Avg speeds in km/h for different zones (Historical Data)
    private static final Map<String, Double> ZONE_SPEEDS = Map.of(
        "CASABLANCA", 22.0,
        "TANGER", 30.0,
        "MARRAKECH", 28.0,
        "RABAT", 25.0,
        "DEFAULT", 35.0
    );

    @Override
    @Transactional
    public com.deliveryplatform.dto.response.CascadeETAResult updateCascadeETA(java.util.UUID driverId, Double currentLat, Double currentLng) {
        log.debug("Updating cascade ETA for driver {}", driverId);

        // 1. Get active orders for the driver
        List<Order> orders = orderRepository.findByDriverIdAndStatusIn(driverId, 
            List.of(OrderStatus.ASSIGNED, OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY));

        if (orders.isEmpty()) {
            return com.deliveryplatform.dto.response.CascadeETAResult.builder()
                .stops(new ArrayList<>())
                .totalRemainingKm(0.0)
                .totalRemainingMin(0)
                .build();
        }

        // Sort by sequenceIndex
        orders.sort(Comparator.comparing(Order::getSequenceIndex, Comparator.nullsLast(Comparator.naturalOrder())));

        // 2. Reconstruct stops sequence
        List<InternalStop> remainingStops = new ArrayList<>();
        for (Order order : orders) {
            // Add Pickup if not yet picked up
            if (order.getStatus() == OrderStatus.ASSIGNED) {
                remainingStops.add(new InternalStop(order.getId(), "PICKUP", 
                    order.getPickupAddress(), order.getPickupLat(), order.getPickupLng(), 
                    order.getSenderCity(), null));
            }
            // Add Delivery if not delivered
            if (order.getStatus() != OrderStatus.DELIVERED) {
                remainingStops.add(new InternalStop(order.getId(), "DELIVERY", 
                    order.getDeliveryAddress(), order.getDeliveryLat(), order.getDeliveryLng(), 
                    order.getReceiverCity(), order.getDeadline()));
            }
        }

        // 3. Calculate ETA cumulatively
        double accumLat = currentLat;
        double accumLng = currentLng;
        LocalDateTime accumTime = LocalDateTime.now();
        int currentHour = accumTime.getHour();
        double trafficFactor = getTrafficFactor(currentHour);

        List<com.deliveryplatform.dto.response.CascadeETAResult.StopETA> stopEtas = new ArrayList<>();
        double totalDist = 0;

        for (InternalStop stop : remainingStops) {
            double distance = calculateHaversine(accumLat, accumLng, stop.lat, stop.lng);
            String city = stop.city != null ? stop.city.toUpperCase() : "DEFAULT";
            double baseSpeed = ZONE_SPEEDS.getOrDefault(city, ZONE_SPEEDS.get("DEFAULT"));
            double actualSpeed = baseSpeed * trafficFactor;
            
            double travelTimeMin = (distance / actualSpeed) * 60;
            double buffer = city.equals("CASABLANCA") ? 15.0 : 8.0;
            double durationMin = travelTimeMin + buffer;
            
            accumTime = accumTime.plusMinutes((long) Math.ceil(durationMin));
            totalDist += distance;

            // SLA Check
            String slaStatus = "ON_TRACK";
            if (stop.deadline != null && accumTime.isAfter(stop.deadline)) {
                slaStatus = "EXCEEDED";
            }

            stopEtas.add(com.deliveryplatform.dto.response.CascadeETAResult.StopETA.builder()
                .orderId(stop.orderId)
                .type(stop.type)
                .address(stop.address)
                .eta(accumTime)
                .distanceKm(distance)
                .durationMin(durationMin)
                .slaStatus(slaStatus)
                .build());

            // Update Order entity if it's a delivery stop
            if (stop.type.equals("DELIVERY")) {
                updateOrderETA(stop.orderId, accumTime, slaStatus);
            }

            accumLat = stop.lat;
            accumLng = stop.lng;
        }

        com.deliveryplatform.dto.response.CascadeETAResult result = com.deliveryplatform.dto.response.CascadeETAResult.builder()
            .stops(stopEtas)
            .totalRemainingKm(totalDist)
            .totalRemainingMin((int) java.time.Duration.between(LocalDateTime.now(), accumTime).toMinutes())
            .estimatedEndTime(accumTime)
            .nextStopAddress(stopEtas.isEmpty() ? null : stopEtas.get(0).getAddress())
            .build();

        // 5. Broadcast WebSocket
        broadcastUpdates(driverId, result);

        return result;
    }

    private void updateOrderETA(java.util.UUID orderId, LocalDateTime eta, String slaStatus) {
        orderRepository.findById(orderId).ifPresent(order -> {
            order.setCurrentEta(eta);
            order.setSlaStatus(com.deliveryplatform.domain.entity.SLAStatus.valueOf(slaStatus));
            orderRepository.save(order);
            
            // Notify client for this specific order
            messagingTemplate.convertAndSend("/topic/tracking/" + orderId, Map.of(
                "eta", eta.toString(),
                "slaStatus", slaStatus
            ));
        });
    }

    private void broadcastUpdates(java.util.UUID driverId, com.deliveryplatform.dto.response.CascadeETAResult result) {
        messagingTemplate.convertAndSend("/topic/driver/" + driverId + "/eta", result);
    }

    private double getTrafficFactor(int hour) {
        if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20)) return 0.6;
        if (hour >= 12 && hour <= 14) return 0.8;
        if (hour >= 22 || hour <= 6) return 1.2;
        return 1.0;
    }

    private static class InternalStop {
        java.util.UUID orderId;
        String type;
        String address;
        double lat;
        double lng;
        String city;
        LocalDateTime deadline;

        InternalStop(java.util.UUID orderId, String type, String address, Double lat, Double lng, String city, LocalDateTime deadline) {
            this.orderId = orderId;
            this.type = type;
            this.address = address;
            this.lat = lat != null ? lat : 0.0;
            this.lng = lng != null ? lng : 0.0;
            this.city = city;
            this.deadline = deadline;
        }
    }

    @Override
    @Transactional
    public void updateLiveETA(java.util.UUID orderId, Double driverLat, Double driverLng) {
        // Keep existing simple update for single order context or refactor to call cascade
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return;
        
        // This is now partially superseded by updateCascadeETA but kept for direct order updates
        double distance = calculateHaversine(driverLat, driverLng, order.getDeliveryLat(), order.getDeliveryLng());
        String city = order.getReceiverCity() != null ? order.getReceiverCity().toUpperCase() : "DEFAULT";
        double speed = ZONE_SPEEDS.getOrDefault(city, ZONE_SPEEDS.get("DEFAULT")) * getTrafficFactor(LocalDateTime.now().getHour());
        
        int totalMin = (int) Math.ceil((distance / speed) * 60 + (city.equals("CASABLANCA") ? 15.0 : 8.0));
        order.setCurrentEta(LocalDateTime.now().plusMinutes(totalMin));
        order.setSlaStatus(order.getDeadline() != null && order.getCurrentEta().isAfter(order.getDeadline()) ? SLAStatus.EXCEEDED : SLAStatus.ON_TRACK);
        orderRepository.save(order);
    }

    @Override
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void processDelayAlerts() {
        List<Order> activeOrders = orderRepository.findByStatus(OrderStatus.ON_THE_WAY);
        for (Order order : activeOrders) {
            if (order.getCurrentEta() != null && order.getDeadline() != null 
                && order.getCurrentEta().isAfter(order.getDeadline()) 
                && !order.isDelayAlertSent()) {
                
                log.warn("Delay Alert: Order {} is delayed", order.getTrackingNumber());
                if (order.getClient() != null) {
                    notificationService.createNotification(order.getClient().getId(), "Retard prévu pour " + order.getTrackingNumber(), "DELAY_ALERT");
                }
                order.setDelayAlertSent(true);
                orderRepository.save(order);
            }
        }
    }

    private double calculateHaversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
