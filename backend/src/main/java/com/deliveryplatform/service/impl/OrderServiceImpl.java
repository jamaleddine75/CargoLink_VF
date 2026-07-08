package com.deliveryplatform.service.impl;

import com.deliveryplatform.dto.request.CreateOrderRequest;
import com.deliveryplatform.dto.request.OrderItemRequest;
import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.dto.response.OrderItemResponse;
import com.deliveryplatform.domain.entity.OrderItem;
import com.deliveryplatform.dto.response.PagedResponse;
import com.deliveryplatform.dto.response.ClientKPIsResponse;
import com.deliveryplatform.dto.response.DriverStatsResponse;
import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.OrderStatus;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.domain.entity.Driver;
import com.deliveryplatform.domain.entity.TrackingHistory;
import com.deliveryplatform.domain.entity.Incident;
import com.deliveryplatform.domain.entity.SLAStatus;
import com.deliveryplatform.domain.entity.DriverRating;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.repository.OrderItemRepository;
import com.deliveryplatform.repository.DriverRepository;
import com.deliveryplatform.repository.UserRepository;
import com.deliveryplatform.repository.TrackingHistoryRepository;
import com.deliveryplatform.repository.IncidentRepository;

import com.deliveryplatform.repository.DriverRatingRepository;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.exception.BusinessException;
import com.deliveryplatform.exception.BadRequestException;
import org.springframework.data.domain.Pageable;
import com.deliveryplatform.mapper.OrderMapper;
import com.deliveryplatform.service.OrderService;
import com.deliveryplatform.service.WalletService;
import com.deliveryplatform.service.validation.CashWorkflowValidator;
import com.deliveryplatform.service.NotificationService;
import com.deliveryplatform.exception.UnauthorizedException;
import com.deliveryplatform.exception.ForbiddenException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderServiceImpl implements OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final TrackingHistoryRepository trackingHistoryRepository;
    private final IncidentRepository incidentRepository;
    private final WalletService walletService;
    private final DriverRatingRepository driverRatingRepository;
    private final OrderMapper orderMapper;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final com.deliveryplatform.service.CloudStorageService cloudStorageService;
    private final com.deliveryplatform.service.PricingService pricingService;
    private final CashWorkflowValidator cashWorkflowValidator;
    private final NotificationService notificationService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.deliveryplatform.service.AuditService auditService;
    private final com.deliveryplatform.service.WebSocketEventService wsEventService;
    private final com.deliveryplatform.service.ShiftService shiftService;


    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Override
    public PagedResponse<OrderResponse> getOrders(UUID driverId, String status, Integer page, Integer size) {
        try {
            List<OrderStatus> statuses;
            if (status != null && !status.isEmpty() && !status.equals("undefined")) {
                statuses = Arrays.stream(status.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(this::mapToOrderStatus)
                        .distinct()
                        .collect(Collectors.toList());
            } else {
                statuses = Arrays.asList(OrderStatus.ASSIGNED, OrderStatus.PICKUP_READY, OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY);
            }

            Page<Order> orderPage;
            if (driverId != null) {
                orderPage = orderRepository.findByDriverIdAndStatusIn(driverId, statuses,
                        PageRequest.of(page != null ? page : 0, size != null ? size : 20));
            } else {
                orderPage = orderRepository.findByStatusIn(statuses, PageRequest.of(page != null ? page : 0, size != null ? size : 20));
            }

            List<OrderResponse> content = orderPage.getContent().stream()
                    .map(orderMapper::toResponse)
                    .collect(Collectors.toList());

            int finalPage = (page != null) ? page : 0;
            int finalSize = (size != null) ? size : 20;

            return PagedResponse.<OrderResponse>builder()
                    .content(content)
                    .page(finalPage)
                    .size(finalSize)
                    .currentPage(finalPage)
                    .pageSize(finalSize)
                    .totalElements(orderPage.getTotalElements())
                    .totalPages(orderPage.getTotalPages())
                    .last(orderPage.isLast())
                    .build();
        } catch (Throwable t) {
            log.error("FATAL Error fetching general orders: {}", t.getMessage(), t);
            return PagedResponse.<OrderResponse>builder()
                    .content(java.util.Collections.emptyList())
                    .currentPage(page != null ? page : 0)
                    .pageSize(size != null ? size : 20)
                    .totalElements(0L).totalPages(0).last(true).build();
        }
    }

    @Override
    public OrderResponse getOrderById(UUID id, UUID userId, String role) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));

        // Security Check: Only Client, Assigned Driver, or ADMIN can view order details
        boolean isAdmin = "ROLE_ADMIN".equals(role);
        boolean isOwner = order.getClient() != null && order.getClient().getId().equals(userId);
        
        // Resolve Driver ID from User ID for comparison
        UUID driverId = driverRepository.findByUserId(userId).map(Driver::getId).orElse(null);
        boolean isAssignedDriver = order.getDriver() != null && order.getDriver().getId().equals(driverId);

        if (!isAdmin && !isOwner && !isAssignedDriver) {
            log.warn("Unauthorized access attempt to order {} by user {} (Role: {})", id, userId, role);
            throw new UnauthorizedException("You are not authorized to view this order.");
        }

        OrderResponse resp = orderMapper.toResponse(order);
        resp.setItems(toItemResponses(order.getId()));
        return resp;
    }

    @Override
    public OrderResponse findByTrackingNumberForDriver(String trackingNumber, UUID driverId) {
        Order order = orderRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "trackingNumber", trackingNumber));

        // Resolve driverId in case it's a userId
        UUID finalDriverId = driverRepository.findByUserId(driverId)
                .map(Driver::getId)
                .orElse(driverId);

        if (order.getDriver() == null || !order.getDriver().getId().equals(finalDriverId)) {
            throw new UnauthorizedException("This order is not assigned to you.");
        }

        OrderResponse resp = orderMapper.toResponse(order);
        resp.setItems(toItemResponses(order.getId()));
        return resp;
    }

    @Override
    public OrderResponse findByTrackingNumber(String trackingNumber) {
        Order order = orderRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "trackingNumber", trackingNumber));
        return orderMapper.toResponse(order);
    }

    @Override
    public OrderResponse createOrder(CreateOrderRequest request, UUID clientId) {
        log.info("createOrder - START - clientId: {}", clientId);
        try {
            Order order = orderMapper.toEntity(request);

            User client = userRepository.findById(clientId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", clientId));

            order.setClient(client);
            
            // Critical Fix: Inherit agency from client if available (needed for reporting/filtering)
            if (client.getAgency() != null) {
                order.setAgency(client.getAgency());
                log.info("Order assigned to agency: {}", client.getAgency().getName());
            }

            // Ensure unique tracking number using high-resolution timestamp + random
            String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            order.setTrackingNumber("TRK-" + System.currentTimeMillis() + "-" + uniqueSuffix);
            
            order.setStatus(OrderStatus.PENDING);
            order.setCreatedAt(LocalDateTime.now());
            order.setValidated(false);
            // Hash the default PIN "0000"
            order.setDeliveryProofPin(passwordEncoder.encode("0000"));

            // If coordinates are missing, set defaults based on city
            if (order.getPickupLat() == null || order.getPickupLng() == null) {
                setCityCoordinates(order, true);
            }
            if (order.getDeliveryLat() == null || order.getDeliveryLng() == null) {
                setCityCoordinates(order, false);
            }

            // Ensure distance is present
            if (order.getDistance() == null || order.getDistance() <= 0) {
                Double dist = 0.0;
                if (order.getPickupLat() != null && order.getPickupLng() != null &&
                    order.getDeliveryLat() != null && order.getDeliveryLng() != null) {
                    dist = calculateDistance(order.getPickupLat(), order.getPickupLng(), order.getDeliveryLat(), order.getDeliveryLng());
                }
                
                if (dist == null || dist <= 0 || dist == Double.MAX_VALUE) {
                    if (order.getSenderCity() != null && order.getReceiverCity() != null) {
                        if (order.getSenderCity().equalsIgnoreCase(order.getReceiverCity())) {
                            dist = 5.0; // intra-city fallback
                        } else {
                            dist = 100.0; // inter-city fallback
                        }
                    } else {
                        dist = 10.0; // general fallback
                    }
                }
                order.setDistance(dist);
            }

            // Apply AI/Config-based Pricing
            pricingService.calculatePricing(order);

            Order saved = orderRepository.save(order);
            log.info("Order saved successfully with ID: {}", saved.getId());

            // Persist order items if provided
            if (request.getItems() != null && !request.getItems().isEmpty()) {
                for (OrderItemRequest itemReq : request.getItems()) {
                    orderItemRepository.save(OrderItem.builder()
                        .order(saved)
                        .itemName(itemReq.getItemName())
                        .quantity(itemReq.getQuantity())
                        .weight(itemReq.getWeight())
                        .description(itemReq.getDescription())
                        .build());
                }
            }

            // Generate Barcode using saved ID
            try {
                String barcodeValue = "ORDER-" + saved.getId();
                String barcodeFileName = "order-" + saved.getId() + ".png";
                String barcodePath = com.deliveryplatform.util.BarcodeGenerator.generateBarcode(barcodeValue, barcodeFileName);
                
                saved.setBarcode(barcodeValue);
                saved.setBarcodeImagePath(barcodePath);
                saved = orderRepository.save(saved); // Update with barcode info
            } catch (Exception e) {
                log.error("Failed to generate barcode for order {}: {}", saved.getId(), e.getMessage());
            }
            
            // 8. Notify Customer
            notificationService.createNotification(
                saved.getClient().getId(),
                "Votre commande " + saved.getTrackingNumber() + " a été créée avec succès.",
                "SUCCESS"
            );

            // 9. Audit Log
            auditService.logOrderAction(clientId, saved.getId(), "ORDER_CREATED", "Tracking: " + saved.getTrackingNumber());

            // 10. Realtime: Broadcast new order to drivers and admin
            OrderResponse response = orderMapper.toResponse(saved);
            response.setItems(toItemResponses(saved.getId()));
            wsEventService.broadcastNewOrder(response);

            return response;

        } catch (Throwable t) {
            log.error("createOrder - CRITICAL ERROR for client {}: {}", clientId, t.getMessage(), t);
            throw t;
        }
    }

    private List<OrderItemResponse> toItemResponses(java.util.UUID orderId) {
        return orderItemRepository.findByOrderId(orderId).stream()
            .map(item -> OrderItemResponse.builder()
                .id(item.getId().toString())
                .itemName(item.getItemName())
                .quantity(item.getQuantity())
                .weight(item.getWeight())
                .description(item.getDescription())
                .build())
            .collect(Collectors.toList());
    }

    @Override
    public OrderResponse updateOrderStatus(UUID orderId, UUID userId, String statusStr, Double lat, Double lng,
            String photoUrl, String scanValue, String comment, Boolean codCollected) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // FIX BS-11: Verify Assignment - Only the assigned driver can update status
        UUID driverId = driverRepository.findByUserId(userId)
                .map(Driver::getId)
                .orElseThrow(() -> new UnauthorizedException("Driver profile not found."));

        if (order.getDriver() == null || !order.getDriver().getId().equals(driverId)) {
            throw new UnauthorizedException("You are not authorized to update this order; it is not assigned to you.");
        }

        OrderStatus oldStatus = order.getStatus();
        OrderStatus newStatus = mapToOrderStatus(statusStr);
        validateDriverStatusTransition(oldStatus, newStatus);

        // Geofencing: Restrict DELIVERED status if driver is > 200m away (since ARRIVED is gone)
        if (newStatus == OrderStatus.DELIVERED && lat != null && lng != null) {
            if (order.getDeliveryLat() == null || order.getDeliveryLng() == null) {
                log.error("Missing delivery coordinates for order {}", orderId);
                throw new BusinessException("Cannot verify location: Order missing delivery coordinates.");
            }
            double dist = calculateDistance(lat, lng, order.getDeliveryLat(), order.getDeliveryLng());
            if (dist > 0.2) { // 0.2 km = 200 meters
                log.warn("Geofencing restriction: Driver at ({}, {}) is {}m away from delivery point ({}, {})", 
                    lat, lng, Math.round(dist * 1000), order.getDeliveryLat(), order.getDeliveryLng());
                throw new BusinessException("You must be within 200m of the delivery location to confirm delivery (Current: " + Math.round(dist * 1000) + "m).");
            }
        }

        order.setStatus(newStatus);

        switch (newStatus) {
            case PICKUP_READY:
                order.setPickupDate(LocalDateTime.now());
                break;
            case PICKED_UP:
                // New status PICKED_UP logic if needed
                break;
            case ON_THE_WAY:
                order.setDeliveryStartedDate(LocalDateTime.now());
                break;
            case DELIVERED:
                order.setDeliveredAt(LocalDateTime.now());
                walletService.handleOrderDelivery(order, codCollected);
                // Realtime Shift Hub Update
                try {
                    shiftService.recordDelivery(userId, order.getDriverEarnings(), order.getCodAmount(), 
                        order.getDistance() != null ? order.getDistance() : 0.0);
                } catch (Exception e) {
                    log.warn("Shift Hub update failed for order {}: {}", orderId, e.getMessage());
                }
                break;
            case FAILED:
                // Handle refusal/cancellation logic here as well
                order.setReassignmentCount(order.getReassignmentCount() != null ? order.getReassignmentCount() + 1 : 1);
                log.info("Order {} marked as FAILED (refused/cancelled). Reassignment count: {}", orderId, order.getReassignmentCount());
                // Realtime Shift Hub Update
                try {
                    shiftService.recordFailure(userId);
                } catch (Exception e) {
                    log.warn("Shift Hub update (failure) failed for order {}: {}", orderId, e.getMessage());
                }
                break;
            default:
                break;
        }

        Order saved = orderRepository.save(order);
        saveTrackingHistory(orderId, newStatus.name(), lat, lng, photoUrl, scanValue, comment, codCollected);
        
        // Audit status change
        auditService.logOrderAction(userId, orderId, "STATUS_UPDATED", 
                "From " + oldStatus + " to " + newStatus + (comment != null ? " | Comment: " + comment : ""));

        log.info("Order {} status changed from {} to {}", orderId, oldStatus, newStatus);
        
        OrderResponse response = orderMapper.toResponse(saved);
        // Realtime: Broadcast status update via centralized service (order topic + admin feed)
        wsEventService.broadcastOrderUpdate(orderId, response);

        // Notify customer of status change
        if (saved.getClient() != null) {
            notificationService.createNotification(
                saved.getClient().getId(),
                "Le statut de votre commande " + saved.getTrackingNumber() + " est désormais: " + newStatus.name(),
                "INFO"
            );
        }
        
        return response;

    }

    private void validateDriverStatusTransition(OrderStatus oldStatus, OrderStatus newStatus) {
        if (oldStatus == null || newStatus == null) return;

        // Lenient transitions for driver convenience
        boolean valid = (oldStatus == newStatus) || switch (oldStatus) {
            case PENDING, VALIDATED, ASSIGNED -> 
                newStatus == OrderStatus.ASSIGNED || newStatus == OrderStatus.PICKUP_READY || newStatus == OrderStatus.FAILED;
            case PICKUP_READY -> 
                newStatus == OrderStatus.PICKED_UP || newStatus == OrderStatus.ON_THE_WAY || newStatus == OrderStatus.FAILED;
            case PICKED_UP, ON_THE_WAY -> 
                newStatus == OrderStatus.ON_THE_WAY || newStatus == OrderStatus.DELIVERED || newStatus == OrderStatus.FAILED;
            default -> true; // Be permissive for other states
        };

        if (!valid) {
            log.warn("Restrictive transition blocked: {} -> {}, but allowing for recovery.", oldStatus, newStatus);
        }
    }

    private OrderStatus mapToOrderStatus(String status) {
        if (status == null || status.isEmpty() || status.equals("undefined"))
            return OrderStatus.PENDING;

        String s = status.toUpperCase().trim();
        try {
            return OrderStatus.valueOf(s);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown status string: {}. Falling back to legacy mapping or default.", s);
            // Fallback for extremely common legacy statuses if they still leak from old
            // clients
            switch (s) {
                case "EN_ATTENTE":
                case "WAITING":
                case "WAITING_FOR_DRIVER":
                    return OrderStatus.PENDING;
                case "VALIDEE":
                    return OrderStatus.VALIDATED;
                case "ASSIGNEE":
                case "ASSIGNED":
                    return OrderStatus.ASSIGNED;
                case "EN_RECUPERATION":
                case "PICKING_UP":
                case "PICKUP":
                case "AWAITING_PICKUP":
                    return OrderStatus.PICKUP_READY;
                case "EN_LIVRAISON":
                case "ON_THE_WAY":
                case "EN_ROUTE_DELIVERY":
                    return OrderStatus.ON_THE_WAY;
                case "LIVREE":
                case "DELIVERED":
                    return OrderStatus.DELIVERED;
                case "ARRIVEE":
                case "ARRIVED":
                    return OrderStatus.ON_THE_WAY; // Map ARRIVED to ON_THE_WAY
                case "PROBLEME":
                case "ISSUE":
                case "FAILED":
                    return OrderStatus.FAILED;
                case "ANNULEE":
                case "CANCELLED":
                    return OrderStatus.CANCELLED;
                case "REFUSEE":
                case "REFUSED":
                    return OrderStatus.FAILED; // Map REFUSED to FAILED
                case "PICKED_UP":
                    return OrderStatus.PICKED_UP;
                case "RETURNED":
                    return OrderStatus.RETURNED;
                default:
                    return OrderStatus.PENDING;
            }
        }
    }

    @Override
    public List<OrderResponse> batchUpdateOrderStatus(List<String> trackingNumbers, String statusStr, Double lat,
            Double lng, String comment, UUID userId) {
        log.info("Batch updating {} orders to status {} by user {}", trackingNumbers.size(), statusStr, userId);
        
        // Ownership Validation
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        boolean isAdmin = user.getRole() == com.deliveryplatform.domain.entity.Role.ADMIN;
        UUID driverId = isAdmin
            ? null
            : driverRepository.findByUserId(userId)
                .map(Driver::getId)
                .orElseThrow(() -> new UnauthorizedException("Driver profile not found."));

        List<Order> orders = orderRepository.findByTrackingNumberIn(trackingNumbers);
        OrderStatus newStatus = mapToOrderStatus(statusStr);
        LocalDateTime now = LocalDateTime.now();

        return orders.stream().map(order -> {
            // Ownership check for each order in batch
            if (!isAdmin && (order.getDriver() == null || !order.getDriver().getId().equals(driverId))) {
                throw new ForbiddenException("You are not authorized to update order " + order.getTrackingNumber());
            }

            // Validate state transition
            try {
                validateDriverStatusTransition(order.getStatus(), newStatus);
            } catch (IllegalStateException e) {
                throw new BusinessException("Cannot batch-update order " + order.getTrackingNumber()
                        + " from " + order.getStatus() + " to " + newStatus + ": " + e.getMessage());
            }
            order.setStatus(newStatus);

            switch (newStatus) {
                case PICKUP_READY:
                    order.setPickupDate(now);
                    break;
                case ON_THE_WAY:
                    order.setDeliveryStartedDate(now);
                    break;
                case DELIVERED:
                    order.setDeliveredAt(now);
                    break;
                default:
                    break;
            }

            Order saved = orderRepository.save(order);
            saveTrackingHistory(order.getId(), newStatus.name(), lat, lng, null, null, comment, null);
            
            OrderResponse response = orderMapper.toResponse(saved);
            // Realtime: Broadcast each batch update via centralized service
            wsEventService.broadcastOrderUpdate(saved.getId(), response);
            
            return response;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponse acceptOrder(UUID orderId, java.util.UUID userId) {
        log.info("Driver {} attempting to accept order {}", userId, orderId);

        // 1. Lock the order to prevent race conditions
        Order order = orderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // 2. Resolve Driver
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "userId", userId));

        // 3. Handle Idempotency (Already assigned to this driver)
        if (order.getDriver() != null && order.getDriver().getId().equals(driver.getId())) {
            if (order.getStatus() == OrderStatus.ASSIGNED) {
                log.info("Order {} already assigned to driver {}. Returning current state.", orderId, userId);
                return orderMapper.toResponse(order);
            }
            // If it's already past ASSIGNED (e.g. PICKUP_READY), they shouldn't call accept
            throw new BusinessException("Order is already in progress: " + order.getStatus());
        }

        // 4. Validate Order State for Acceptance
        // We allow PENDING or EN_ATTENTE
        if (order.getStatus() != OrderStatus.PENDING) {
            if (order.getDriver() != null) {
                throw new BusinessException("Order is already assigned to another driver");
            }
            throw new BusinessException("Order cannot be accepted in its current state: " + order.getStatus());
        }

        // 5. Enforce Business Rule: Multi-order batching (Max 3, within 5km)
        List<OrderStatus> activeStatuses = Arrays.asList(
                OrderStatus.ASSIGNED, OrderStatus.PICKUP_READY, OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY);
        
        List<Order> otherActiveOrders = orderRepository.findByDriverIdAndStatusIn(driver.getId(), activeStatuses);
        
        if (otherActiveOrders.size() >= 3) {
            throw new BusinessException("You have reached the maximum limit of 3 active orders.");
        }


        if (!otherActiveOrders.isEmpty()) {
            boolean isNear = false;
            for (Order activeOrder : otherActiveOrders) {
                double dist = calculateDistance(
                        order.getPickupLat(), order.getPickupLng(),
                        activeOrder.getPickupLat(), activeOrder.getPickupLng());
                
                if (dist <= 5.0) { // 5km radius
                    isNear = true;
                    break;
                }
            }
            
            if (!isNear) {
                throw new BusinessException("This order is too far from your current active missions (max 5km).");
            }
        }

        // 6. Secure the Assignment
        order.setDriver(driver);
        order.setStatus(OrderStatus.ASSIGNED);
        order.setLastAssignedAt(LocalDateTime.now());
        order.setAssignedAt(LocalDateTime.now());

        // 7. Dynamic Pricing: 10% Surge Bonus if accepted within 5 minutes of creation
        if (order.getCreatedAt() != null && order.getCreatedAt().plusMinutes(5).isAfter(LocalDateTime.now())) {
            BigDecimal currentFee = order.getDeliveryFee() != null ? order.getDeliveryFee() : BigDecimal.valueOf(20.0);
            BigDecimal surgeBonus = currentFee.multiply(BigDecimal.valueOf(0.10));
            order.setDeliveryFee(currentFee.add(surgeBonus).setScale(2, java.math.RoundingMode.HALF_UP));
            log.info("Surge Bonus: 10% applied to order {}. New fee: {}", order.getId(), order.getDeliveryFee());
        }

        Order saved = orderRepository.save(order);

        // 7. Audit/History
        saveTrackingHistory(orderId, OrderStatus.ASSIGNED.name(), null, null, null, null, "Driver accepted order",
                null);
        auditService.logOrderAction(userId, orderId, "ORDER_ACCEPTED", "Driver: " + driver.getId());

        // 8. Notify Customer
        if (saved.getClient() != null) {
            notificationService.createNotification(
                saved.getClient().getId(),
                "Votre commande " + saved.getTrackingNumber() + " a été acceptée par un livreur.",
                "SUCCESS"
            );
        }

        log.info("Order {} successfully accepted by driver {}", orderId, driver.getId());

        // Realtime: Broadcast order accepted to customer, admin, and order watchers
        OrderResponse acceptResponse = orderMapper.toResponse(saved);
        wsEventService.broadcastOrderUpdate(orderId, acceptResponse);

        return acceptResponse;

    }

    @Override
    public OrderResponse refuseOrder(UUID orderId, java.util.UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Allow refusal if PENDING (offer) or ASSIGNED (active mission)
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.ASSIGNED) {
            throw new BusinessException("Order cannot be refused/cancelled in its current state: " + order.getStatus());
        }

        // Return to available pool
        order.setStatus(OrderStatus.PENDING);
        order.setDriver(null);
        order.setReassignmentCount(order.getReassignmentCount() != null ? order.getReassignmentCount() + 1 : 1);

        Order saved = orderRepository.save(order);
        saveTrackingHistory(orderId, OrderStatus.PENDING.name(), null, null, null, null, "Driver refused order, returned to pool", null);

        log.info("Order {} refused and returned to available pool", orderId);
        auditService.logOrderAction(userId, orderId, "ORDER_REFUSED", "Returned to available pool");
        
        // Realtime: Broadcast order update + availability
        OrderResponse refuseResponse = orderMapper.toResponse(saved);
        wsEventService.broadcastOrderUpdate(orderId, refuseResponse);
        wsEventService.broadcastOrderAvailable(refuseResponse);
        
        return refuseResponse;
    }

    private void saveTrackingHistory(UUID orderId, String status, Double lat, Double lng,
            String photoUrl, String scanValue, String comment, Boolean codCollected) {
        TrackingHistory history = TrackingHistory.builder()
                .orderId(orderId)
                .status(status)
                .latitude(lat)
                .longitude(lng)
                .photoUrl(photoUrl)
                .scanValue(scanValue)
                .comment(comment)
                .timestamp(LocalDateTime.now())
                .build();
        trackingHistoryRepository.save(history);
    }

    @Override
    public OrderResponse collectCash(UUID orderId, java.util.UUID userId) {
        // Task 4: Log authorities to verify roles during request handling
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            log.debug("User {} authorities: {}", userId, auth.getAuthorities());
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Resolve driver from user ID
        log.debug("Resolving driver for user ID: {}", userId);
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> {
                    log.error("Forbidden: Driver profile not found for user ID: {}", userId);
                    return new ForbiddenException("Driver profile not found.");
                });

        // Validation: Order belongs to authenticated driver
        if (order.getDriver() == null) {
            log.error("Forbidden: Order {} has no assigned driver", orderId);
            throw new ForbiddenException("This order has no assigned driver.");
        }
        
        if (!order.getDriver().getId().equals(driver.getId())) {
            log.error("Forbidden: Order {} assigned to driver {}, but user is driver {}", 
                orderId, order.getDriver().getId(), driver.getId());
            throw new ForbiddenException("You are not authorized to collect cash for this order; it is not assigned to you.");
        }

        // Use centralized validator
        cashWorkflowValidator.validateForCollection(order);

        // Update fields
        order.setCashCollected(true);
        order.setCashCollectedAt(LocalDateTime.now());
        
        // Sync with existing COD logic
        order.setCodCollected(true);
        order.setPaymentStatus(com.deliveryplatform.domain.entity.PaymentStatus.COLLECTED_BY_DRIVER);

        Order saved = orderRepository.save(order);
        log.info("Cash collection marked for order {} by driver {}", orderId, driver.getId());
        auditService.logOrderAction(userId, orderId, "CASH_COLLECTED", "Amount: " + order.getCodAmount());
        
        // Realtime: Broadcast cash collection to order watchers and admin
        OrderResponse cashResponse = orderMapper.toResponse(saved);
        wsEventService.broadcastOrderUpdate(orderId, cashResponse);

        return cashResponse;
    }

    @Override
    public OrderResponse reportProblem(UUID id, String category, String description) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));

        order.setStatus(OrderStatus.FAILED);
        Order saved = orderRepository.save(order);

        Incident incident = Incident.builder()
                .orderId(id)
                .title(category != null ? category : "Delivery issue")
                .category(category)
                .description(description)
                .status("REPORTED")
                .createdAt(LocalDateTime.now())
                .build();
        incidentRepository.save(incident);

        log.warn("Incident reported for order {}: {}", id, description);
        auditService.logOrderAction(null, id, "PROBLEM_REPORTED", category + ": " + description);

        // Realtime: Broadcast problem to order watchers and admin
        OrderResponse problemResponse = orderMapper.toResponse(saved);
        wsEventService.broadcastOrderUpdate(id, problemResponse);

        return problemResponse;
    }

    @Override
    public List<?> getOrderTracking(UUID orderId) {
        return trackingHistoryRepository.findByOrderIdOrderByTimestampDesc(orderId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getActiveOrder(UUID userId) {
        log.info("Fetching active orders for driver user: {}", userId);
        try {
            Optional<Driver> driverOpt = driverRepository.findByUserId(userId);
            if (driverOpt.isEmpty()) {
                log.warn("Cannot fetch active orders: Driver profile not found for user {}", userId);
                return Collections.emptyList();
            }

            Driver driver = driverOpt.get();
            List<Order> activeOrders = orderRepository.findByDriverIdAndStatusIn(
                    driver.getId(),
                    Arrays.asList(OrderStatus.VALIDATED, OrderStatus.ASSIGNED, OrderStatus.PICKUP_READY,
                            OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY));

            return activeOrders.stream()
                    .map(order -> {
                        try {
                            return orderMapper.toResponse(order);
                        } catch (Exception e) {
                            log.error("Error mapping active order {}: {}", order.getId(), e.getMessage());
                            return null;
                        }
                    })
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("CRITICAL ERROR fetching active orders for user {}: {}", userId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    @Override
    public PagedResponse<OrderResponse> getClientOrders(UUID clientId, String status, Integer page, Integer size) {
        log.info("getClientOrders - START - clientId: {}, status: {}, page: {}, size: {}", clientId, status, page, size);
        try {
            if (clientId == null) {
                log.error("getClientOrders - Invalid clientId: {}", clientId);
                return createEmptyPagedResponse(page, size);
            }

            Pageable pageable = PageRequest.of(page != null ? page : 0, size != null ? size : 20);
            Page<Order> orderPage;
            
            if (status != null && !status.isEmpty() && !"all".equalsIgnoreCase(status) && !"undefined".equals(status)) {
                log.info("getClientOrders - Filtering by status: {}", status);
                List<OrderStatus> statuses = Arrays.stream(status.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(this::mapToOrderStatus)
                        .distinct()
                        .collect(Collectors.toList());
                
                orderPage = orderRepository.findByClientIdAndStatusIn(clientId, statuses, pageable);
            } else {
                log.info("getClientOrders - Fetching all orders for client");
                orderPage = orderRepository.findByClientId(clientId, pageable);
            }

            if (orderPage == null) {
                log.warn("getClientOrders - orderPage is null");
                return createEmptyPagedResponse(page, size);
            }

            List<OrderResponse> content = orderPage.getContent().stream()
                    .map(order -> {
                        try {
                            return orderMapper.toResponse(order);
                        } catch (Exception e) {
                            log.error("getClientOrders - Error mapping order {}: {}", order.getId(), e.getMessage());
                            return null;
                        }
                    })
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());

            log.info("getClientOrders - SUCCESS - Found {} orders", orderPage.getTotalElements());

            int finalPage = (page != null) ? page : 0;
            int finalSize = (size != null) ? size : 20;

            return PagedResponse.<OrderResponse>builder()
                    .content(content)
                    .page(finalPage)
                    .size(finalSize)
                    .currentPage(finalPage)
                    .pageSize(finalSize)
                    .totalElements(orderPage.getTotalElements())
                    .totalPages(orderPage.getTotalPages())
                    .last(orderPage.isLast())
                    .build();
        } catch (Throwable t) {
            log.error("getClientOrders - CRITICAL FATAL ERROR for {}: {}", clientId, t.getMessage(), t);
            return createEmptyPagedResponse(page, size);
        }
    }

    private PagedResponse<OrderResponse> createEmptyPagedResponse(Integer page, Integer size) {
        int finalPage = (page != null) ? page : 0;
        int finalSize = (size != null) ? size : 20;
        
        return PagedResponse.<OrderResponse>builder()
                .content(Collections.emptyList())
                .page(finalPage)
                .size(finalSize)
                .currentPage(finalPage)
                .pageSize(finalSize)
                .totalElements(0L)
                .totalPages(0)
                .last(true)
                .build();
    }

    @Override
    public ClientKPIsResponse getClientKPIs(UUID clientId) {
        // Verify user exists
        if (!userRepository.existsById(clientId)) {
            log.warn("User profile not found for ID: {}", clientId);
            return ClientKPIsResponse.builder()
                    .totalSent(0).inTransit(0).delivered(0).pendingPayment(java.math.BigDecimal.ZERO).build();
        }

        long totalSent = orderRepository.countByClientId(clientId);
        long inTransit = orderRepository.countByClientIdAndStatusIn(clientId,
                Arrays.asList(OrderStatus.ASSIGNED, OrderStatus.PICKUP_READY, OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY));
        long delivered = orderRepository.countByClientIdAndStatus(clientId, OrderStatus.DELIVERED);
        java.math.BigDecimal pendingCod = orderRepository.sumPendingCodByClientId(clientId);

        return com.deliveryplatform.dto.response.ClientKPIsResponse.builder()
                .totalSent(totalSent)
                .inTransit(inTransit)
                .delivered(delivered)
                .pendingPayment(pendingCod != null ? pendingCod : java.math.BigDecimal.ZERO)
                .build();
    }

    @Override
    public DriverStatsResponse getDriverStats(java.util.UUID userId) {
        // Resolve Driver from User ID (Consistent with other services)
        java.util.Optional<com.deliveryplatform.domain.entity.Driver> driverOpt = driverRepository.findByUserId(userId);

        if (driverOpt.isEmpty()) {
            log.warn("Cannot calculate stats: Driver profile not found for User ID {}", userId);
            return DriverStatsResponse.builder()
                    .totalOrders(0).completedOrders(0).totalEarnings(java.math.BigDecimal.ZERO)
                    .averageRating(5.0).successRate(100.0).pendingCOD(java.math.BigDecimal.ZERO).build();
        }

        com.deliveryplatform.domain.entity.Driver driver = driverOpt.get();
        UUID did = driver.getId();

        long totalOrders = orderRepository.findByDriverIdAndStatusIn(did,
                Arrays.asList(OrderStatus.ASSIGNED, OrderStatus.PICKUP_READY, OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY,
                        OrderStatus.DELIVERED, OrderStatus.FAILED, OrderStatus.CANCELLED),
                PageRequest.of(0, 1)).getTotalElements();

        long completed = orderRepository.countByDriverIdAndStatus(did, OrderStatus.DELIVERED);

        java.math.BigDecimal pendingCod = orderRepository.sumTotalCodByDriverIdAndStatus(did, OrderStatus.DELIVERED, false);
        if (pendingCod == null)
            pendingCod = java.math.BigDecimal.ZERO;

        java.math.BigDecimal totalEarnings = orderRepository.sumDriverEarningsByDriverIdAndStatus(did, OrderStatus.DELIVERED);
        if (totalEarnings == null) totalEarnings = java.math.BigDecimal.ZERO;

        return com.deliveryplatform.dto.response.DriverStatsResponse.builder()
                .totalOrders((int) totalOrders)
                .completedOrders((int) completed)
                .totalEarnings(totalEarnings)
                .averageRating(4.8)
                .successRate(totalOrders > 0 ? (completed * 100.0 / totalOrders) : 100.0)
                .pendingCOD(pendingCod)
                .build();
    }

    @Override
    public void processOrder(java.util.UUID orderId) {
        log.info("Processing order {}", orderId);
    }

    @Override
    public void generateRoute(java.util.UUID orderId) {
        log.info("Generating route for order {}", orderId);
    }
    @Override
    public PagedResponse<OrderResponse> getAvailableOrders(UUID userId, Integer page, Integer size) {
        log.info("getAvailableOrders - START - userId: {}, page: {}, size: {}", userId, page, size);
        try {
            Optional<Driver> driverOpt = driverRepository.findByUserId(userId);
            if (driverOpt.isEmpty()) {
                log.warn("getAvailableOrders - no driver profile for user {}", userId);
                return createEmptyPagedResponse(page, size);
            }

            Driver driver = driverOpt.get();

            // 1. Availability Check
            if (driver.getAvailability() != com.deliveryplatform.domain.entity.DriverAvailability.AVAILABLE) {
                log.info("Driver {} is not AVAILABLE (Status: {}), returning empty list of orders", userId, driver.getAvailability());
                return createEmptyPagedResponse(page, size);
            }

            // 2. Mission Limit Check (Max 3)
            List<OrderStatus> activeStatuses = Arrays.asList(
                    OrderStatus.ASSIGNED, OrderStatus.PICKUP_READY, OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY);
            long activeCount = orderRepository.countByDriverIdAndStatusIn(driver.getId(), activeStatuses);

            if (activeCount >= 3) {
                log.info("Driver {} has {} active missions (Limit: 3), returning empty list", userId, activeCount);
                return createEmptyPagedResponse(page, size);
            }

            int finalPage = page != null ? page : 0;
            int finalSize = size != null ? size : 20;

            Page<Order> orderPage = orderRepository.findByStatusInAndDriverIsNull(
                    Arrays.asList(OrderStatus.PENDING), PageRequest.of(finalPage, finalSize));
            List<OrderResponse> content = orderPage.getContent().stream()
                    .map(orderMapper::toResponse)
                    .collect(Collectors.toList());
            return PagedResponse.<OrderResponse>builder()
                    .content(content)
                    .currentPage(finalPage)
                    .pageSize(finalSize)
                    .totalElements(orderPage.getTotalElements())
                    .totalPages(orderPage.getTotalPages())
                    .last(orderPage.isLast())
                    .build();
        } catch (Throwable t) {
            log.error("getAvailableOrders - CRITICAL ERROR for {}: {}", userId, t.getMessage(), t);
            return createEmptyPagedResponse(page, size);
        }
    }

    @Override
    public PagedResponse<OrderResponse> getDriverHistory(UUID userId, String status, LocalDate startDate, LocalDate endDate, Integer page, Integer size) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "userId", userId));

        List<OrderStatus> statuses = null;
        if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)) {
            statuses = Arrays.stream(status.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(this::mapToOrderStatus)
                    .distinct()
                    .collect(Collectors.toList());
        }

        if (statuses == null || statuses.isEmpty()) {
            statuses = Arrays.asList(OrderStatus.values());
        }

        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.plusDays(1).atStartOfDay().minusNanos(1) : null;

        Page<Order> orderPage = orderRepository.findDriverHistory(
                driver.getId(),
                statuses,
                startDateTime,
                endDateTime,
                PageRequest.of(page, size));

        List<OrderResponse> content = orderPage.getContent().stream()
                .map(orderMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<OrderResponse>builder()
                .content(content)
                .currentPage(page)
                .pageSize(size)
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    /**
     * Phase 5: Get driver dashboard statistics
     */
    @Override
    public java.util.Map<String, Object> getDriverDashboardStats(UUID userId) {
        log.info("Fetching hardened legacy dashboard stats for user {}", userId);
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        
        try {
            Optional<Driver> driverOpt = driverRepository.findByUserId(userId);
            if (driverOpt.isEmpty()) {
                log.warn("Legacy stats requested for user {} but no driver found.", userId);
                return createDefaultStatsMap();
            }
            
            Driver driver = driverOpt.get();
            UUID driverId = driver.getId();
            LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();

            // Completed today — filter by deliveredAt so orders created earlier but
            // delivered today are correctly counted.
            long completedToday = 0;
            try {
                completedToday = orderRepository.countByDriverIdAndStatusAndDeliveredAtAfter(
                        driverId, OrderStatus.DELIVERED, todayStart);
            } catch (Exception e) { log.error("Legacy stats error (completedToday): {}", e.getMessage()); }

            // Total earnings today — wallet GAIN transactions first, fall back to
            // summing driverEarnings on DELIVERED orders with deliveredAt >= todayStart.
            java.math.BigDecimal earningsToday = java.math.BigDecimal.ZERO;
            try {
                earningsToday = walletService.getDailyEarnings(userId);
                if (earningsToday == null || earningsToday.compareTo(java.math.BigDecimal.ZERO) == 0) {
                    earningsToday = orderRepository.sumDriverEarningsByDriverIdAndStatusAndDeliveredAtAfter(
                            driverId, OrderStatus.DELIVERED, todayStart);
                }
            } catch (Exception e) { log.error("Legacy stats error (earningsToday): {}", e.getMessage()); }

            // Total orders all time
            long totalOrders = 0;
            try {
                totalOrders = orderRepository.countByDriverId(driverId);
            } catch (Exception e) { log.error("Legacy stats error (totalOrders): {}", e.getMessage()); }

            // Failed today
            long todayFailed = 0;
            try {
                todayFailed = orderRepository.countByDriverIdAndStatusAndCreatedAtAfter(
                        driverId, OrderStatus.FAILED, todayStart);
            } catch (Exception e) { log.error("Legacy stats error (todayFailed): {}", e.getMessage()); }

            // Last order earnings
            java.math.BigDecimal lastOrderEarnings = java.math.BigDecimal.ZERO;
            try {
                lastOrderEarnings = orderRepository.findFirstByDriverIdAndStatusInOrderByCreatedAtDesc(
                        driverId, List.of(OrderStatus.DELIVERED))
                        .map(Order::getDriverEarnings)
                        .orElse(java.math.BigDecimal.ZERO);
            } catch (Exception e) { log.error("Legacy stats error (lastOrderEarnings): {}", e.getMessage()); }

            stats.put("completedToday", completedToday);
            stats.put("earnings", earningsToday != null ? earningsToday : java.math.BigDecimal.ZERO);
            stats.put("totalOrders", totalOrders);
            stats.put("averageRating", 4.8);
            stats.put("pendingOrders", 0); // Simplified
            stats.put("todayFailed", todayFailed);
            stats.put("lastOrderEarnings", lastOrderEarnings);
            
            return stats;
        } catch (Exception e) {
            log.error("CRITICAL Error in legacy getDriverDashboardStats: {}", e.getMessage());
            return createDefaultStatsMap();
        }
    }

    private java.util.Map<String, Object> createDefaultStatsMap() {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("completedToday", 0);
        stats.put("earnings", java.math.BigDecimal.ZERO);
        stats.put("totalOrders", 0);
        stats.put("averageRating", 4.8);
        stats.put("pendingOrders", 0);
        stats.put("todayFailed", 0);
        stats.put("lastOrderEarnings", java.math.BigDecimal.ZERO);
        return stats;
    }

    /**
     * Phase 5: Assign order to driver
     */
    @Override
    public OrderResponse assignOrderToDriver(UUID orderId, UUID driverId) {
        log.info("Assigning order {} to driver {}", orderId, driverId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getDriver() != null) {
            throw new BadRequestException("Order is already assigned to another driver");
        }

        if (!Arrays.asList(OrderStatus.PENDING, OrderStatus.PICKUP_READY).contains(order.getStatus())) {
            throw new BadRequestException(
                    "Order is not available for assignment. Current status: " + order.getStatus());
        }

        // Find driver by user ID or use provided driver ID
        Driver driver = driverRepository.findByUserId(driverId)
                .orElseGet(() -> driverRepository.findById(driverId)
                        .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId.toString())));

        order.setDriver(driver);
        order.setStatus(OrderStatus.ASSIGNED);
        order.setAssignedAt(LocalDateTime.now());

        Order savedOrder = orderRepository.save(order);
        log.info("Order {} successfully assigned to driver {}", orderId, driver.getId());

        // Realtime: Broadcast order assignment to all watchers + notify driver
        OrderResponse assignResponse = orderMapper.toResponse(savedOrder);
        wsEventService.broadcastOrderUpdate(orderId, assignResponse);
        wsEventService.sendUserNotification(driver.getUser().getId(), java.util.Map.of(
                "type", "ORDER_ASSIGNED",
                "message", "Nouvelle mission assignée : " + order.getTrackingNumber(),
                "orderId", orderId.toString(),
                "timestamp", java.time.LocalDateTime.now().toString()));

        return assignResponse;
    }

    /**
     * Phase 5: Submit proof of delivery (photo or PIN)
     */
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public OrderResponse submitProofOfDelivery(UUID orderId, UUID driverId, String proofMethod,
            String pinCode, org.springframework.web.multipart.MultipartFile photo,
            String notes) throws Exception {
        try {
            log.info("Submitting proof of delivery for order {} via {} (User: {})", orderId, proofMethod, driverId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Verify order belongs to driver
        UUID actualDriverId = order.getDriver() != null ? order.getDriver().getId() : null;
        Driver driver = driverRepository.findByUserId(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "userId", driverId.toString()));

        if (!driver.getId().equals(actualDriverId)) {
            throw new UnauthorizedException("This order does not belong to you");
        }

        // Verify order is in a deliverable state (Flexible for driver convenience)
        List<OrderStatus> deliverableStatuses = Arrays.asList(
            OrderStatus.ON_THE_WAY, 
            OrderStatus.PICKED_UP, 
            OrderStatus.PICKUP_READY,
            OrderStatus.ASSIGNED
        );

        if (!deliverableStatuses.contains(order.getStatus())) {
            log.warn("Order {} is in status {}, but allowing delivery attempt anyway.", orderId, order.getStatus());
        }

        // Process proof based on method
        String method = proofMethod != null ? proofMethod.toLowerCase().trim() : "";
        
        if ("pin".equals(method)) {
            if (pinCode == null || pinCode.isEmpty()) {
                throw new BadRequestException("PIN code is required for PIN delivery method.");
            }
            
            // Validate PIN (Check against hashed PIN in DB, with fallback for '0000' during transition)
            String storedPin = order.getDeliveryProofPin();
            boolean pinMatches = false;
            
            if (storedPin != null && (storedPin.startsWith("$2a$") || storedPin.startsWith("$2y$"))) {
                pinMatches = passwordEncoder.matches(pinCode, storedPin);
            } else {
                log.error("Order {} has insecure or missing PIN hash. Verification failed.", orderId);
                throw new BadRequestException("Sécurité PIN compromise. Contactez le support.");
            }

            if (!pinMatches) {
                throw new BadRequestException("Code PIN invalide.");
            }
            
            log.info("Order {} validated via PIN", orderId);
            order.setDeliveryProofType("PIN");
        } else if ("photo".equals(method)) {
            if (photo == null || photo.isEmpty()) {
                throw new BadRequestException("Photo file is required for photo delivery method.");
            }
            String photoUrl = cloudStorageService.save(photo);
            order.setDeliveryProofType("PHOTO");
            order.setDeliveryProofPhotoUrl(photoUrl);
        } else if ("qr_scan".equals(method) || "qr".equals(method)) {
            order.setDeliveryProofType("QR_SCAN");
        } else {
            // Unrecognized method, do not silently set a vulnerable plaintext PIN.
            // Just record the type if it's somehow missing, or leave as is.
            order.setDeliveryProofType("UNKNOWN");
        }

        // Add delivery notes if provided
        if (notes != null && !notes.isEmpty()) {
            order.setDeliveryNotes(notes);
        }

        log.debug("Step 5: Updating order status and timestamp");
        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());

        // Process payment and COD
        try {
            log.debug("Step 6: Processing financials via walletService");
            BigDecimal cod = order.getCodAmount() != null ? order.getCodAmount() : BigDecimal.ZERO;
            boolean justCollected = cod.compareTo(BigDecimal.ZERO) > 0;
            walletService.handleOrderDelivery(order, justCollected);
            log.info("Financials processed successfully for order {}", orderId);
        } catch (Throwable t) {
            log.error("CRITICAL: Error in WalletService for order {}: {} (Type: {})", 
                orderId, t.getMessage(), t.getClass().getName(), t);
            // We don't throw here to ensure the order is at least marked as delivered
        }

        log.debug("Step 7: Final save for order {}", orderId);
        int points = 150;
        order.setPointsEarned(points);
        Order savedOrder = orderRepository.save(order);
        
        // Award points to driver
        driver.setLoyaltyPoints((driver.getLoyaltyPoints() != null ? driver.getLoyaltyPoints() : 0) + points);
        driverRepository.save(driver);
        
            log.info("Order {} delivery confirmed successfully via {}. Awarded {} points.", orderId, method, points);
            
            OrderResponse response = orderMapper.toResponse(savedOrder);
            response.setPointsEarned(points);
            // Ensure driverEarnings is set on the response even if the mapper misses it
            if (savedOrder.getDriverEarnings() != null) {
                response.setDriverEarnings(savedOrder.getDriverEarnings());
            }

            // Realtime: Broadcast delivery confirmation to customer and admin
            wsEventService.broadcastOrderUpdate(orderId, response);

            return response;
        } catch (Exception e) {
            log.error("CRITICAL FAILURE in submitProofOfDelivery for order {}: {}", orderId, e.getMessage(), e);
            throw e;
        }
    }
    @Override
    @Transactional
    public void updateSLAStatuses() {
        List<OrderStatus> activeStatuses = Arrays.asList(
                OrderStatus.PENDING, OrderStatus.VALIDATED, OrderStatus.ASSIGNED,
                OrderStatus.PICKUP_READY, OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY);

        List<Order> activeOrders = orderRepository.findByStatusIn(activeStatuses);
        LocalDateTime now = LocalDateTime.now();

        for (Order order : activeOrders) {
            if (order.getDeadline() == null)
                continue;

            SLAStatus newSlaStatus;
            if (now.isAfter(order.getDeadline())) {
                newSlaStatus = SLAStatus.EXCEEDED;
            } else if (now.plusMinutes(30).isAfter(order.getDeadline())) {
                newSlaStatus = SLAStatus.AT_RISK;
            } else {
                newSlaStatus = SLAStatus.ON_TRACK;
            }

            if (order.getSlaStatus() != newSlaStatus) {
                order.setSlaStatus(newSlaStatus);
                orderRepository.save(order);
                log.info("Order {} SLA Status updated to {}", order.getTrackingNumber(), newSlaStatus);

                // Realtime: Broadcast SLA change to admin dashboard
                if (newSlaStatus == SLAStatus.AT_RISK || newSlaStatus == SLAStatus.EXCEEDED) {
                    wsEventService.broadcastOrderUpdate(order.getId(), orderMapper.toResponse(order));
                }
            }
        }
    }

    @Override
    @Transactional
    public OrderResponse confirmPayment(UUID orderId, UUID userId) {
        log.info("Confirming payment for order {} by user {}", orderId, userId);
        
        // 1. Fetch order safely
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // 2. Check if cash_collected = true
        if (!order.isCashCollected()) {
            throw new BadRequestException("Cannot confirm payment: Cash has not been collected by driver yet.");
        }

        if (order.getPaymentStatus() == com.deliveryplatform.domain.entity.PaymentStatus.PAID) {
            log.warn("Payment for order {} is already confirmed (PAID).", orderId);
            return orderMapper.toResponse(order);
        }

        // 3. Update payment_status to PAID
        order.setPaymentStatus(com.deliveryplatform.domain.entity.PaymentStatus.PAID);
        order.setPaymentConfirmedAt(LocalDateTime.now());
        order.setCashConfirmed(true);
        order.setCashConfirmedAt(LocalDateTime.now());

        // 4. Update Wallet balance and Create Transaction
        // We use walletService.processTransaction to handle both
        if (order.getCodAmount() != null && order.getCodAmount().compareTo(BigDecimal.ZERO) > 0) {
            String description = "Paiement COD confirmé pour la commande " + order.getTrackingNumber();
            
            // If order has an agency, we might want to credit agency wallet instead?
            // But user asked to "Update the corresponding Wallet balance"
            // Usually this means the Agency Wallet in this context.
            if (order.getAgency() != null) {
                // If there's an agency, we should ideally use agency wallet logic
                // For now, following the specific request to create a transaction record.
                walletService.processTransaction(
                    order.getAgency().getAdminAgency().getId(),
                    "CREDIT", 
                    order.getCodAmount(),
                    description,
                    orderId
                );
            } else {
                // Fallback to driver or global admin if no agency (simplified)
                log.warn("Order {} has no agency, skipped wallet balance update in confirmPayment", orderId);
            }
        }

        Order saved = orderRepository.save(order);
        
        // 5. Audit History
        saveTrackingHistory(orderId, "PAYMENT_CONFIRMED", null, null, null, null, "Paiement confirmé par l'agence", null);

        log.info("Payment confirmed successfully for order {}", orderId);

        // Realtime: Broadcast payment confirmation
        OrderResponse paymentResponse = orderMapper.toResponse(saved);
        wsEventService.broadcastOrderUpdate(orderId, paymentResponse);

        return paymentResponse;
    }

    private double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return Double.MAX_VALUE;
        }
        
        final int R = 6371; // Radious of the earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Override
    @Transactional
    public void deleteAllOrders() {
        log.info("Executing TRUNCATE TABLE orders CASCADE to wipe all missions...");
        // Using native query to avoid foreign key constraint issues
        jakarta.persistence.Query query = entityManager.createNativeQuery("TRUNCATE TABLE orders CASCADE;");
        query.executeUpdate();
        log.info("Successfully wiped all orders and cascading data.");

        // Realtime: Force admin dashboard refresh after mass deletion
        wsEventService.broadcastAdminDashboardRefresh("ALL_ORDERS_DELETED");
    }

    @Override
    @Transactional
    public void rateDriver(UUID orderId, UUID clientId, Integer rating, String comment) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BusinessException("You can only rate a driver after the order is delivered.");
        }

        if (order.getClient() == null || !order.getClient().getId().equals(clientId)) {
            throw new UnauthorizedException("You are not the client for this order.");
        }

        if (order.getDriver() == null) {
            throw new BusinessException("No driver assigned to this order.");
        }

        if (rating == null || rating < 1 || rating > 5) {
            throw new BusinessException("Rating must be between 1 and 5.");
        }

        if (driverRatingRepository.findByOrderId(orderId).isPresent()) {
            throw new BusinessException("You have already rated the driver for this order.");
        }

        Driver driver = order.getDriver();
        
        DriverRating driverRating = DriverRating.builder()
                .driver(driver)
                .client(order.getClient())
                .order(order)
                .rating(rating)
                .comment(comment)
                .build();
                
        driverRatingRepository.save(driverRating);

        // Update driver's aggregated rating
        Double newAvg = driverRatingRepository.getAverageRatingForDriver(driver.getId());
        Integer newCount = driverRatingRepository.getRatingCountForDriver(driver.getId());
        
        driver.setRating(newAvg != null ? Math.round(newAvg * 10.0) / 10.0 : 4.8);
        driver.setRatingCount(newCount != null ? newCount : 0);
        
        driverRepository.save(driver);

        // Realtime: Notify driver of new rating
        if (driver.getUser() != null) {
            wsEventService.sendUserNotification(driver.getUser().getId(), java.util.Map.of(
                    "type", "NEW_RATING",
                    "rating", rating,
                    "averageRating", driver.getRating(),
                    "orderId", orderId.toString(),
                    "timestamp", java.time.LocalDateTime.now().toString()
            ));
        }
    }

    private void setCityCoordinates(Order order, boolean isPickup) {
        String city = isPickup ? order.getSenderCity() : order.getReceiverCity();
        Double lat = 35.7595; // Default Tangier
        Double lng = -5.8340;
        
        if (city != null) {
            String c = city.trim().toUpperCase();
            switch (c) {
                case "TETOUAN":
                    lat = 35.5785;
                    lng = -5.3684;
                    break;
                case "CASABLANCA":
                    lat = 33.5731;
                    lng = -7.5898;
                    break;
                case "RABAT":
                    lat = 34.0209;
                    lng = -6.8416;
                    break;
                case "TANGER":
                default:
                    lat = 35.7595;
                    lng = -5.8340;
                    break;
            }
        }
        
        if (isPickup) {
            order.setPickupLat(lat);
            order.setPickupLng(lng);
        } else {
            order.setDeliveryLat(lat);
            order.setDeliveryLng(lng);
        }
    }
}

