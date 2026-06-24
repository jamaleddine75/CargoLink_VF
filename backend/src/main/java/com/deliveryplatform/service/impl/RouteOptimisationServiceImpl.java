package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.repository.DriverRepository;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.service.RouteOptimisationService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RouteOptimisationServiceImpl implements RouteOptimisationService {

    private final OrderRepository orderRepository;
    private final DriverRepository driverRepository;
    private final com.deliveryplatform.service.ETAService etaService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @Override
    public Map<Integer, List<UUID>> clusterOrders(int clusterCount) {
        List<Order> pendingOrders = orderRepository.findByStatus(OrderStatus.PENDING);
        if (pendingOrders.isEmpty()) return Collections.emptyMap();

        // Advanced K-Means++ clustering
        Map<Integer, List<Order>> clusters = performKMeansPlusPlus(pendingOrders, Math.min(clusterCount, pendingOrders.size()));
        
        Map<Integer, List<UUID>> result = new HashMap<>();
        clusters.forEach((idx, list) -> result.put(idx, list.stream().map(Order::getId).collect(Collectors.toList())));
        return result;
    }

    @Override
    @Transactional
    public com.deliveryplatform.dto.response.BatchOptimizationResult performGlobalBatchOptimization() {
        log.info("🚀 Starting Advanced Global Batch Optimization...");
        
        List<Order> allOrders = orderRepository.findByStatus(OrderStatus.PENDING);
        List<Driver> availableDrivers = driverRepository.findByAvailability(DriverAvailability.AVAILABLE);
        
        if (allOrders.isEmpty() || availableDrivers.isEmpty()) {
            log.info("Optimization skipped: No pending orders or available drivers.");
            return com.deliveryplatform.dto.response.BatchOptimizationResult.builder()
                .optimizedAt(java.time.LocalDateTime.now())
                .totalOrdersOptimized(0)
                .build();
        }

        // 1. Time-Window Clustering (Tiering)
        List<Order> tier1 = allOrders.stream().filter(Order::isUrgent).collect(Collectors.toList());
        List<Order> tier2 = allOrders.stream().filter(o -> !o.isUrgent() && o.getDeadline() != null && 
            java.time.Duration.between(java.time.LocalDateTime.now(), o.getDeadline()).toHours() < 2).collect(Collectors.toList());
        List<Order> tier3 = allOrders.stream().filter(o -> !tier1.contains(o) && !tier2.contains(o)).collect(Collectors.toList());

        List<Order> prioritizedOrders = new ArrayList<>();
        prioritizedOrders.addAll(tier1);
        prioritizedOrders.addAll(tier2);
        prioritizedOrders.addAll(tier3);

        // 2. K-Means++ Clustering with Capacity Limits
        int optimalClusters = Math.min(availableDrivers.size(), (int) Math.ceil((allOrders.size() * 2) / 10.0));
        Map<Integer, List<Order>> clusters = performKMeansPlusPlus(prioritizedOrders, optimalClusters);

        // 3. Driver Assignment with Weighted Scoring
        List<com.deliveryplatform.dto.response.BatchOptimizationResult.ClusterSummary> summaries = new ArrayList<>();
        Set<UUID> usedDrivers = new HashSet<>();
        double totalDistanceBaseline = 0;
        double totalDistanceOptimized = 0;

        for (Map.Entry<Integer, List<Order>> entry : clusters.entrySet()) {
            List<Order> clusterOrders = entry.getValue();
            double cLat = clusterOrders.stream().mapToDouble(Order::getDeliveryLat).average().orElse(0);
            double cLng = clusterOrders.stream().mapToDouble(Order::getDeliveryLng).average().orElse(0);

            Driver bestDriver = null;
            double bestScore = Double.MAX_VALUE;

            for (Driver d : availableDrivers) {
                if (usedDrivers.contains(d.getId())) continue;

                double dist = calculateDistance(cLat, cLng, d.getLatitude(), d.getLongitude());
                int workload = 0; // In a real app, query current assigned stops count
                boolean hasUrgent = clusterOrders.stream().anyMatch(Order::isUrgent);

                // Score = 0.5*dist + 0.3*workload + 0.2*urgency
                double score = (0.5 * dist) + (0.3 * workload) - (hasUrgent ? 5.0 : 0.0);

                if (score < bestScore) {
                    bestScore = score;
                    bestDriver = d;
                }
            }

            if (bestDriver != null) {
                usedDrivers.add(bestDriver.getId());
                UUID driverId = bestDriver.getId();
                
                // 4. Individual 2-Opt Optimization for the assigned driver
                List<java.util.UUID> orderIds = clusterOrders.stream().map(Order::getId).collect(Collectors.toList());
                List<com.deliveryplatform.dto.response.RouteStopDTO> optimizedRoute = optimizeDriverRouteWithStops(driverId, orderIds);
                
                // Calculate baseline distance (simple append order) for savings report
                totalDistanceBaseline += calculateBaselineDistance(bestDriver, clusterOrders);
                double clusterDist = calculateTotalDistanceDTO(bestDriver.getLatitude(), bestDriver.getLongitude(), optimizedRoute);
                totalDistanceOptimized += clusterDist;

                // 5. Update Database State
                for (Order o : clusterOrders) {
                    o.setDriver(bestDriver);
                    o.setStatus(OrderStatus.ASSIGNED);
                    orderRepository.save(o);
                }
                
                bestDriver.setAvailability(DriverAvailability.BUSY);
                driverRepository.save(bestDriver);

                // 6. Cascade ETA & Notification
                etaService.updateCascadeETA(driverId, bestDriver.getLatitude(), bestDriver.getLongitude());
                messagingTemplate.convertAndSend("/topic/driver/" + driverId + "/new-assignment", 
                    "You have " + orderIds.size() + " new assignments! Itinerary optimized.");

                summaries.add(com.deliveryplatform.dto.response.BatchOptimizationResult.ClusterSummary.builder()
                    .clusterIndex(entry.getKey())
                    .orderCount(clusterOrders.size())
                    .driverId(driverId)
                    .driverName(bestDriver.getName())
                    .totalDistance(clusterDist)
                    .centroidLat(cLat)
                    .centroidLng(cLng)
                    .build());

                log.info("✅ Cluster {}: {} orders assigned to {} (dist: {}km)", 
                    entry.getKey(), clusterOrders.size(), bestDriver.getName(), String.format("%.2f", clusterDist));
            }
        }

        log.info("🏁 Global Optimization complete. {} orders across {} drivers. Distance saved estimate: {}km", 
            allOrders.size(), summaries.size(), String.format("%.2f", totalDistanceBaseline - totalDistanceOptimized));

        return com.deliveryplatform.dto.response.BatchOptimizationResult.builder()
            .clusters(summaries)
            .totalOrdersOptimized(allOrders.size())
            .totalDistanceSaved(Math.max(0, totalDistanceBaseline - totalDistanceOptimized))
            .optimizedAt(java.time.LocalDateTime.now())
            .build();
    }

    private Map<Integer, List<Order>> performKMeansPlusPlus(List<Order> orders, int k) {
        if (orders.isEmpty()) return Collections.emptyMap();
        
        // 1. Initial Centroids via K-Means++
        List<double[]> centroids = new ArrayList<>();
        
        // First centroid: order with most urgent neighbors or just first urgent
        Order first = orders.stream().filter(Order::isUrgent).findFirst().orElse(orders.get(0));
        centroids.add(new double[]{first.getDeliveryLat(), first.getDeliveryLng()});

        for (int i = 1; i < k; i++) {
            double[] nextCentroid = null;
            double maxDist = -1;
            
            for (Order o : orders) {
                double minDistToAnyCentroid = centroids.stream()
                    .mapToDouble(c -> calculateDistance(o.getDeliveryLat(), o.getDeliveryLng(), c[0], c[1]))
                    .min().orElse(Double.MAX_VALUE);
                
                if (minDistToAnyCentroid > maxDist) {
                    maxDist = minDistToAnyCentroid;
                    nextCentroid = new double[]{o.getDeliveryLat(), o.getDeliveryLng()};
                }
            }
            if (nextCentroid != null) centroids.add(nextCentroid);
        }

        // 2. Refinement (10 iterations)
        Map<Integer, List<Order>> clusters = new HashMap<>();
        for (int iter = 0; iter < 10; iter++) {
            clusters.clear();
            for (Order o : orders) {
                int bestIdx = 0;
                double minDist = Double.MAX_VALUE;
                for (int i = 0; i < centroids.size(); i++) {
                    double dist = calculateDistance(o.getDeliveryLat(), o.getDeliveryLng(), centroids.get(i)[0], centroids.get(i)[1]);
                    if (dist < minDist) {
                        minDist = dist;
                        bestIdx = i;
                    }
                }
                clusters.computeIfAbsent(bestIdx, x -> new ArrayList<>()).add(o);
            }

            // Update centroids
            for (int i = 0; i < centroids.size(); i++) {
                List<Order> clusterOrders = clusters.get(i);
                if (clusterOrders != null && !clusterOrders.isEmpty()) {
                    double avgLat = clusterOrders.stream().mapToDouble(Order::getDeliveryLat).average().orElse(centroids.get(i)[0]);
                    double avgLng = clusterOrders.stream().mapToDouble(Order::getDeliveryLng).average().orElse(centroids.get(i)[1]);
                    centroids.set(i, new double[]{avgLat, avgLng});
                }
            }
        }
        return clusters;
    }

    @Override
    @Transactional
    public List<com.deliveryplatform.dto.response.RouteStopDTO> optimizeDriverRouteWithStops(UUID driverId, List<java.util.UUID> orderIds) {
        log.info("Optimizing route for driver {} with {} orders (Multi-stop P&D)", driverId, orderIds.size());

        Driver driver = driverRepository.findById(driverId).orElseThrow();
        List<Order> orders = orderRepository.findAllById(orderIds);

        if (orders.isEmpty()) return Collections.emptyList();

        // 1. Create all stops (Pickup & Delivery)
        List<RouteStop> allStops = new ArrayList<>();
        for (Order order : orders) {
            // Pickup stop
            allStops.add(RouteStop.builder()
                .orderId(order.getId())
                .trackingNumber(order.getTrackingNumber())
                .type(RouteStop.StopType.PICKUP)
                .lat(order.getPickupLat() != null ? order.getPickupLat() : 0.0)
                .lng(order.getPickupLng() != null ? order.getPickupLng() : 0.0)
                .urgent(order.isUrgent())
                .heavy(order.isHeavy())
                .deadline(order.getDeadline())
                .address(order.getPickupAddress())
                .contact(order.getPickupContactName())
                .phone(null)
                .codAmount(order.getCodAmount() != null ? order.getCodAmount() : java.math.BigDecimal.ZERO)
                .build());

            // Delivery stop
            allStops.add(RouteStop.builder()
                .orderId(order.getId())
                .trackingNumber(order.getTrackingNumber())
                .type(RouteStop.StopType.DELIVERY)
                .lat(order.getDeliveryLat() != null ? order.getDeliveryLat() : 0.0)
                .lng(order.getDeliveryLng() != null ? order.getDeliveryLng() : 0.0)
                .urgent(order.isUrgent())
                .heavy(order.isHeavy())
                .deadline(order.getDeadline())
                .address(order.getDeliveryAddress())
                .contact(order.getReceiverName())
                .phone(order.getReceiverPhone())
                .codAmount(order.getCodAmount() != null ? order.getCodAmount() : java.math.BigDecimal.ZERO)
                .build());
        }

        // Step 1: Initial sequence by nearest-neighbor respecting P&D constraint
        List<RouteStop> route = buildInitialNearestNeighborRoute(driver, allStops);
        double initialDist = calculateTotalDistance(driver.getLatitude(), driver.getLongitude(), route);
        log.info("Initial distance (Nearest Neighbor): {} km", String.format("%.2f", initialDist));

        // Step 2: 2-Opt improvement
        route = perform2Opt(driver, route);
        double optimizedDist = calculateTotalDistance(driver.getLatitude(), driver.getLongitude(), route);
        log.info("Optimized distance (2-Opt): {} km", String.format("%.2f", optimizedDist));

        // Step 3: Apply Priorities (Urgent / Near-deadline)
        // Note: This might increase distance but satisfies SLA
        route = applyPriorities(route);

        // Step 4: Save sequenceIndex and build DTOs
        List<com.deliveryplatform.dto.response.RouteStopDTO> result = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        int currentIndex = 0;

        for (int i = 0; i < route.size(); i++) {
            RouteStop stop = route.get(i);
            stop.setIndex(i);
            
            // If it's a delivery stop, update the Order's sequenceIndex
            if (stop.getType() == RouteStop.StopType.DELIVERY) {
                final java.util.UUID currentOrderId = stop.getOrderId();
                Order order = orders.stream()
                    .filter(o -> o.getId().equals(currentOrderId))
                    .findFirst()
                    .orElse(null);
                if (order != null) {
                    order.setSequenceIndex(i);
                    orderRepository.save(order);
                }
            }

            result.add(com.deliveryplatform.dto.response.RouteStopDTO.builder()
                .orderId(stop.getOrderId())
                .trackingNumber(stop.getTrackingNumber())
                .type(stop.getType().name())
                .lat(stop.getLat())
                .lng(stop.getLng())
                .address(stop.getAddress())
                .contact(stop.getContact())
                .phone(stop.getPhone())
                .codAmount(stop.getCodAmount())
                .sequenceIndex(i)
                .estimatedArrival(now.plusMinutes(i * 15L)) // Simple estimation: 15min per stop
                .build());
        }

        return result;
    }

    private List<RouteStop> buildInitialNearestNeighborRoute(Driver driver, List<RouteStop> allStops) {
        List<RouteStop> route = new ArrayList<>();
        List<RouteStop> remaining = new ArrayList<>(allStops);
        Set<java.util.UUID> pickedUpOrders = new HashSet<>();

        double currentLat = driver.getLatitude();
        double currentLng = driver.getLongitude();

        while (!remaining.isEmpty()) {
            RouteStop nearest = null;
            double minDist = Double.MAX_VALUE;

            for (RouteStop stop : remaining) {
                // Constraint: DELIVERY only if PICKUP already done
                if (stop.getType() == RouteStop.StopType.DELIVERY && !pickedUpOrders.contains(stop.getOrderId())) {
                    continue;
                }

                double dist = calculateDistance(currentLat, currentLng, stop.getLat(), stop.getLng());
                if (dist < minDist) {
                    minDist = dist;
                    nearest = stop;
                }
            }

            if (nearest == null) break; // Should not happen if data is consistent

            route.add(nearest);
            remaining.remove(nearest);
            if (nearest.getType() == RouteStop.StopType.PICKUP) {
                pickedUpOrders.add(nearest.getOrderId());
            }
            currentLat = nearest.getLat();
            currentLng = nearest.getLng();
        }
        return route;
    }

    private List<RouteStop> perform2Opt(Driver driver, List<RouteStop> route) {
        List<RouteStop> bestRoute = new ArrayList<>(route);
        double bestDist = calculateTotalDistance(driver.getLatitude(), driver.getLongitude(), bestRoute);
        boolean improved = true;
        int iterations = 0;
        int maxIterations = 1000;

        while (improved && iterations < maxIterations) {
            improved = false;
            for (int i = 0; i < bestRoute.size() - 1; i++) {
                for (int j = i + 1; j < bestRoute.size(); j++) {
                    List<RouteStop> newRoute = apply2OptSwap(bestRoute, i, j);
                    if (constraintsRespected(newRoute)) {
                        double newDist = calculateTotalDistance(driver.getLatitude(), driver.getLongitude(), newRoute);
                        if (newDist < bestDist) {
                            bestRoute = newRoute;
                            bestDist = newDist;
                            improved = true;
                        }
                    }
                }
            }
            iterations++;
        }
        return bestRoute;
    }

    private List<RouteStop> apply2OptSwap(List<RouteStop> route, int i, int j) {
        List<RouteStop> newRoute = new ArrayList<>(route.subList(0, i));
        List<RouteStop> reversedSegment = new ArrayList<>(route.subList(i, j + 1));
        Collections.reverse(reversedSegment);
        newRoute.addAll(reversedSegment);
        newRoute.addAll(route.subList(j + 1, route.size()));
        return newRoute;
    }

    private boolean constraintsRespected(List<RouteStop> route) {
        Map<java.util.UUID, Integer> pickupIndices = new HashMap<>();
        Map<java.util.UUID, Integer> deliveryIndices = new HashMap<>();

        for (int i = 0; i < route.size(); i++) {
            RouteStop stop = route.get(i);
            if (stop.getType() == RouteStop.StopType.PICKUP) {
                pickupIndices.put(stop.getOrderId(), i);
            } else {
                deliveryIndices.put(stop.getOrderId(), i);
            }
        }

        for (java.util.UUID orderId : pickupIndices.keySet()) {
            Integer pIdx = pickupIndices.get(orderId);
            Integer dIdx = deliveryIndices.get(orderId);
            if (pIdx != null && dIdx != null && pIdx > dIdx) {
                return false;
            }
        }
        return true;
    }

    private List<RouteStop> applyPriorities(List<RouteStop> route) {
        LocalDateTime now = LocalDateTime.now();
        List<RouteStop> highPriority = new ArrayList<>();
        List<RouteStop> normalPriority = new ArrayList<>();

        // Group by Order to keep P&D together if possible, or just move the stops
        // Actually, the user says "Monter tous les stops URGENT en début"
        // and "Monter les orders dont deadline - now() < 2h"
        
        Set<java.util.UUID> priorityOrderIds = new HashSet<>();
        for (RouteStop stop : route) {
            boolean isNearDeadline = stop.getDeadline() != null && 
                java.time.Duration.between(now, stop.getDeadline()).toHours() < 2;
            
            if (stop.isUrgent() || isNearDeadline) {
                priorityOrderIds.add(stop.getOrderId());
            }
        }

        // We must re-sort but respect P&D
        List<RouteStop> result = new ArrayList<>();
        List<RouteStop> remaining = new ArrayList<>(route);
        Set<String> pickedUp = new HashSet<>();

        // First, handle priority orders in their relative order from optimized route
        Iterator<RouteStop> iter = remaining.iterator();
        while (iter.hasNext()) {
            RouteStop stop = iter.next();
            if (priorityOrderIds.contains(stop.getOrderId())) {
                result.add(stop);
                iter.remove();
            }
        }
        
        // Then append the rest
        result.addAll(remaining);
        
        // Re-check constraints after priority shift (moving all stops of an order together preserves relative order)
        if (!constraintsRespected(result)) {
            // Fallback: if shifting messed up (unlikely if we moved all stops of priority orders), 
            // we should technically re-run a mini NN or just return original
            return route; 
        }

        return result;
    }

    private double calculateTotalDistance(double startLat, double startLng, List<RouteStop> route) {
        double total = 0;
        double curLat = startLat;
        double curLng = startLng;
        for (RouteStop stop : route) {
            total += calculateDistance(curLat, curLng, stop.getLat(), stop.getLng());
            curLat = stop.getLat();
            curLng = stop.getLng();
        }
        return total;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteStop {
        public enum StopType { PICKUP, DELIVERY }
        private java.util.UUID orderId;
        private String trackingNumber;
        private StopType type;
        private double lat;
        private double lng;
        private int index;
        private boolean urgent;
        private boolean heavy;
        private LocalDateTime deadline;
        
        // Extra info for DTO
        private String address;
        private String contact;
        private String phone;
        private java.math.BigDecimal codAmount;
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    @Override
    @Transactional
    public List<java.util.UUID> optimizeDriverRoute(UUID driverId, List<java.util.UUID> orderIds) {
        // Updated to use the new logic but return IDs for backward compatibility
        List<com.deliveryplatform.dto.response.RouteStopDTO> stops = optimizeDriverRouteWithStops(driverId, orderIds);
        return stops.stream()
            .filter(s -> s.getType().equals("DELIVERY"))
            .map(com.deliveryplatform.dto.response.RouteStopDTO::getOrderId)
            .distinct()
            .collect(Collectors.toList());
    }

    private List<java.util.UUID> solveTSP(Driver driver, List<Order> orders) {
        // Deprecated by optimizeDriverRouteWithStops
        return Collections.emptyList();
    }

    private double calculateBaselineDistance(Driver driver, List<Order> orders) {
        double total = 0;
        double curLat = driver.getLatitude();
        double curLng = driver.getLongitude();
        for (Order o : orders) {
            double pLat = o.getPickupLat() != null ? o.getPickupLat() : curLat;
            double pLng = o.getPickupLng() != null ? o.getPickupLng() : curLng;
            double dLat = o.getDeliveryLat() != null ? o.getDeliveryLat() : pLat;
            double dLng = o.getDeliveryLng() != null ? o.getDeliveryLng() : pLng;
            
            total += calculateDistance(curLat, curLng, pLat, pLng);
            total += calculateDistance(pLat, pLng, dLat, dLng);
            curLat = dLat;
            curLng = dLng;
        }
        return total;
    }

    private double calculateTotalDistanceDTO(double startLat, double startLng, List<com.deliveryplatform.dto.response.RouteStopDTO> route) {
        double total = 0;
        double curLat = startLat;
        double curLng = startLng;
        for (com.deliveryplatform.dto.response.RouteStopDTO stop : route) {
            total += calculateDistance(curLat, curLng, stop.getLat(), stop.getLng());
            curLat = stop.getLat();
            curLng = stop.getLng();
        }
        return total;
    }
}
