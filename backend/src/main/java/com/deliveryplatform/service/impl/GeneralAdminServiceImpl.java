package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.domain.entity.Role;
import com.deliveryplatform.domain.entity.UserStatus;
import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.OrderStatus;
import com.deliveryplatform.domain.entity.Driver;
import com.deliveryplatform.domain.entity.DriverAvailability;
import com.deliveryplatform.domain.entity.AssignmentHistory;
import com.deliveryplatform.domain.entity.AuditLog;
import com.deliveryplatform.domain.entity.Transaction;
import com.deliveryplatform.dto.request.BatchAssignRequest;
import com.deliveryplatform.dto.request.ReassignOrderRequest;
import com.deliveryplatform.dto.response.PagedResponse;
import com.deliveryplatform.dto.response.UserResponse;
import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.dto.response.AdminDashboardResponse;
import com.deliveryplatform.dto.response.FinanceResponse;
import com.deliveryplatform.dto.response.TransactionResponse;
import com.deliveryplatform.dto.response.AssignmentHistoryResponse;
import com.deliveryplatform.dto.response.AuditLogResponse;
import com.deliveryplatform.dto.response.DriverResponse;
import com.deliveryplatform.dto.response.TaskAnalyticsResponse;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.mapper.OrderMapper;
import com.deliveryplatform.mapper.UserMapper;
import com.deliveryplatform.mapper.TransactionMapper;
import com.deliveryplatform.mapper.DriverMapper;
import com.deliveryplatform.mapper.AuditLogMapper;
import com.deliveryplatform.repository.UserRepository;
import com.deliveryplatform.repository.DriverRepository;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.repository.TransactionRepository;
import com.deliveryplatform.repository.AssignmentHistoryRepository;
import com.deliveryplatform.repository.AuditLogRepository;
import com.deliveryplatform.service.GeneralAdminService;
import com.deliveryplatform.service.EmailNotificationService;
import com.deliveryplatform.service.TaskAnalyticsService;
import com.deliveryplatform.service.NotificationService;
import com.deliveryplatform.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GeneralAdminServiceImpl implements GeneralAdminService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final OrderRepository orderRepository;
    private final TransactionRepository transactionRepository;
    private final OrderMapper orderMapper;
    private final UserMapper userMapper;
    private final TransactionMapper transactionMapper;
    private final EmailNotificationService emailNotificationService;
    private final NotificationService notificationService;
    private final TaskAnalyticsService taskAnalyticsService;
    private final DriverMapper driverMapper;
    private final AuditLogService auditLogService;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;
    private final AssignmentHistoryRepository assignmentHistoryRepository;
    private final com.deliveryplatform.service.WebSocketEventService wsEventService;

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> getAllUsers(String role, String status, String search, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        Specification<User> spec = (root, query, cb) -> cb.conjunction();
        
        if (role != null && !role.isEmpty() && !"ALL".equalsIgnoreCase(role)) {
            try {
                Role roleEnum = Role.fromString(role);
                spec = spec.and((root, query, cb) -> cb.equal(root.get("role"), roleEnum));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid role filter: {}", role);
            }
        }
        
        if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            try {
                UserStatus statusEnum = UserStatus.valueOf(status.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), statusEnum));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status filter: {}", status);
            }
        }

        if (search != null && !search.trim().isEmpty()) {
            String searchPattern = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("firstName")), searchPattern),
                cb.like(cb.lower(root.get("lastName")), searchPattern),
                cb.like(cb.lower(root.get("email")), searchPattern)
            ));
        }

        Page<User> userPage = userRepository.findAll(spec, pageable);

        List<UserResponse> content = userPage.getContent().stream()
                .map(user -> {
                    try {
                        UserResponse response = userMapper.toResponse(user);
                        if (response != null && user.getRole() == Role.DRIVER) {
                            driverRepository.findByUserId(user.getId()).ifPresent(driver -> {
                                String info = "";
                                if (driver.getVehicleType() != null) info += driver.getVehicleType().name();
                                if (driver.getVehiclePlate() != null) info += " (" + driver.getVehiclePlate() + ")";
                                response.setVehicleInfo(info.trim());
                                response.setVehicleType(driver.getVehicleType() != null ? driver.getVehicleType().name() : null);
                                response.setVehiclePlate(driver.getVehiclePlate());
                                response.setDriverId(driver.getId());
                            });
                        }
                        return response;
                    } catch (Exception e) {
                        log.warn("Error mapping user {}: {}", user.getId(), e.getMessage());
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());

        return PagedResponse.<UserResponse>builder()
                .content(content)
                .page(page)
                .size(size)
                .currentPage(page)
                .pageSize(size)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getPendingUsers() {
        return userRepository.findByStatus(UserStatus.PENDING).stream()
                .map(user -> {
                    UserResponse response = userMapper.toResponse(user);
                    if (user.getRole() == Role.DRIVER) {
                        driverRepository.findByUserId(user.getId()).ifPresent(driver -> {
                            String info = "";
                            if (driver.getVehicleType() != null) info += driver.getVehicleType().name();
                            if (driver.getVehiclePlate() != null) info += " (" + driver.getVehiclePlate() + ")";
                            response.setVehicleInfo(info.trim());
                        });
                    }
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Override
    public void activateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setActive(true);
        user.setStatus(UserStatus.APPROVED);
        userRepository.save(user);

        // Also update driver status if applicable
        if (user.getRole() == Role.DRIVER) {
            driverRepository.findByUserId(user.getId()).ifPresent(driver -> {
                driver.setVerificationStatus(UserStatus.APPROVED);
                driverRepository.save(driver);
            });
        }
        
        emailNotificationService.sendAccountActivationEmail(user.getEmail(), user.getFirstName());
        auditLogService.log(user.getEmail(), "ACCOUNT_APPROVED", "User " + userId, "0.0.0.0");
        log.info("User {} activated by admin", userId);

        // Realtime: Notify user their account is approved
        wsEventService.sendUserNotification(userId, java.util.Map.of(
                "type", "ACCOUNT_APPROVED",
                "message", "Your account has been approved! You can now log in.",
                "timestamp", java.time.LocalDateTime.now().toString()
        ));
    }

    @Override
    public void rejectUser(UUID userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setActive(false);
        user.setStatus(UserStatus.REJECTED);
        userRepository.save(user);

        // Also update driver status and store reason if applicable
        if (user.getRole() == Role.DRIVER) {
            driverRepository.findByUserId(user.getId()).ifPresent(driver -> {
                driver.setVerificationStatus(UserStatus.REJECTED);
                driver.setRejectionReason(reason);
                driverRepository.save(driver);
            });
        }
        
        emailNotificationService.sendAccountRejectionEmail(user.getEmail(), user.getFirstName(), reason);
        auditLogService.log(user.getEmail(), "ACCOUNT_REJECTED", "User " + userId + " Reason: " + reason, "0.0.0.0");
        log.info("User {} rejected by admin. Reason: {}", userId, reason);

        // Realtime: Notify user their account is rejected
        wsEventService.sendUserNotification(userId, java.util.Map.of(
                "type", "ACCOUNT_REJECTED",
                "message", "Your account has been rejected." + (reason != null ? " Reason: " + reason : ""),
                "timestamp", java.time.LocalDateTime.now().toString()
        ));
    }

    @Override
    public void suspendUser(UUID userId, boolean suspend) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setStatus(suspend ? UserStatus.SUSPENDED : UserStatus.APPROVED);
        user.setActive(!suspend);
        userRepository.save(user);
        auditLogService.log(user.getEmail(), suspend ? "ACCOUNT_SUSPENDED" : "ACCOUNT_UNSUSPENDED", "User " + userId, "0.0.0.0");
        log.info("User {} {} by admin", userId, suspend ? "suspended" : "unsuspended");

        // Realtime: Force-logout suspended user immediately
        if (suspend) {
            wsEventService.sendForceLogout(userId, "Your account has been suspended by an administrator.");
        } else {
            wsEventService.sendUserNotification(userId, java.util.Map.of(
                    "type", "ACCOUNT_UNSUSPENDED",
                    "message", "Your account has been reactivated.",
                    "timestamp", java.time.LocalDateTime.now().toString()
            ));
        }
    }

    @Override
    public void blacklistUser(UUID userId, boolean blacklist) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setStatus(blacklist ? UserStatus.BLACKLISTED : UserStatus.APPROVED);
        user.setActive(!blacklist);
        userRepository.save(user);
        auditLogService.log(user.getEmail(), blacklist ? "ACCOUNT_BLACKLISTED" : "ACCOUNT_UNBLACKLISTED", "User " + userId, "0.0.0.0");
        log.info("User {} {} by admin", userId, blacklist ? "blacklisted" : "unblacklisted");

        // Realtime: Force-logout blacklisted user immediately
        if (blacklist) {
            wsEventService.sendForceLogout(userId, "Your account has been blocked by an administrator.");
        }
    }

    @Override
    public void deleteUser(UUID userId, boolean hardDelete) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        if (hardDelete) {
            userRepository.delete(user);
            log.info("User {} HARD deleted by admin", userId);
            auditLogService.log("ADMIN", "USER_HARD_DELETE", "User: " + userId, "0.0.0.0");
        } else {
            user.setDeleted(true);
            user.setActive(false);
            userRepository.save(user);
            log.info("User {} SOFT deleted by admin", userId);
            auditLogService.log("ADMIN", "USER_SOFT_DELETE", "User: " + userId, "0.0.0.0");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) return new ArrayList<>();
        String pattern = "%" + query.trim().toLowerCase() + "%";
        return userRepository.searchGlobal(pattern).stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<OrderResponse> getOrders(String status, UUID driverId, LocalDateTime start, LocalDateTime end, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        Specification<Order> spec = (root, query, cb) -> cb.conjunction();

        if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            try {
                OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), orderStatus));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid order status filter: {}", status);
            }
        }

        if (driverId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("driver").get("id"), driverId));
        }

        if (start != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), start));
        }

        if (end != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), end));
        }

        Page<Order> orderPage = orderRepository.findAll(spec, pageable);

        List<OrderResponse> content = orderPage.getContent().stream()
                .map(orderMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<OrderResponse>builder()
                .content(content)
                .page(page)
                .size(size)
                .currentPage(page)
                .pageSize(size)
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    @Override
    public void assignDriver(java.util.UUID orderId, UUID driverId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));

        order.setDriver(driver);
        order.setStatus(OrderStatus.ASSIGNED);
        Order savedOrder = orderRepository.save(order);
        log.info("Driver {} assigned to order {}", driverId, orderId);

        // Notify Driver
        if (driver.getUser() != null) {
            notificationService.createNotification(
                driver.getUser().getId(),
                "Nouvelle mission assignée : " + order.getTrackingNumber(),
                "ASSIGNMENT"
            );
        }

        // Realtime: Broadcast order update to all watchers and admin
        wsEventService.broadcastOrderUpdate(orderId, orderMapper.toResponse(savedOrder));
    }

    @Override
    public void updateOrderStatus(java.util.UUID orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        order.setStatus(OrderStatus.valueOf(status.toUpperCase()));
        Order savedOrder = orderRepository.save(order);
        log.info("Order {} status updated to {} by admin", orderId, status);

        // Realtime: Broadcast admin order status change
        wsEventService.broadcastOrderUpdate(orderId, orderMapper.toResponse(savedOrder));
    }

    @Override
    public AdminDashboardResponse getDashboardStats() {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime last24h = now.minusHours(24);
            LocalDateTime prev24h = now.minusHours(48);

            // Order Stats with safe trend calculation
            long totalOrdersToday = orderRepository.countByCreatedAtBetween(last24h, now);
            long totalOrdersYesterday = orderRepository.countByCreatedAtBetween(prev24h, last24h);
            Double ordersTrend = calculateTrend(totalOrdersToday, totalOrdersYesterday);

            // In Progress with safe trend calculation
            long currentInProg = orderRepository.countByStatusInAndCreatedAtBetween(List.of(OrderStatus.ON_THE_WAY, OrderStatus.PICKUP_READY), last24h, now);
            long prevInProg = orderRepository.countByStatusInAndCreatedAtBetween(List.of(OrderStatus.ON_THE_WAY, OrderStatus.PICKUP_READY), prev24h, last24h);
            Double inProgressTrend = calculateTrend(currentInProg, prevInProg);

            // Delivered with safe trend calculation
            long deliveredToday = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.DELIVERED, last24h, now);
            long deliveredYesterday = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.DELIVERED, prev24h, last24h);
            Double deliveredTrend = calculateTrend(deliveredToday, deliveredYesterday);

            return AdminDashboardResponse.builder()
                    .totalOrders(orderRepository.count())
                    .ordersInProgress(orderRepository.countByStatus(OrderStatus.ON_THE_WAY) + orderRepository.countByStatus(OrderStatus.PICKUP_READY))
                    .deliveredOrders(orderRepository.countByStatus(OrderStatus.DELIVERED))
                    .activeDrivers(userRepository.countByRoleAndIsActive(Role.DRIVER, true))
                    .activeClients(userRepository.countByRoleAndIsActive(Role.CUSTOMER, true))
                    .ordersTrend(ordersTrend)
                    .inProgressTrend(inProgressTrend)
                    .deliveredTrend(deliveredTrend)
                    .ordersEvolution(calculateOrdersEvolution())
                    .ordersByStatus(calculateOrdersByStatus())
                    .build();
        } catch (Exception e) {
            log.error("Error generating admin dashboard stats: {}", e.getMessage(), e);
            // Return empty response with some data if possible, or empty DTO
            return AdminDashboardResponse.builder()
                    .totalOrders(0)
                    .ordersInProgress(0)
                    .deliveredOrders(0)
                    .activeDrivers(0)
                    .activeClients(0)
                    .ordersEvolution(new ArrayList<>())
                    .ordersByStatus(new ArrayList<>())
                    .build();
        }
    }

    private List<Map<String, Object>> calculateOrdersEvolution() {
        List<Map<String, Object>> evolution = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime startOfDay = now.minusDays(i).toLocalDate().atStartOfDay();
            LocalDateTime endOfDay = startOfDay.plusDays(1).minusSeconds(1);
            long count = orderRepository.countByCreatedAtBetween(startOfDay, endOfDay);
            String dayName = startOfDay.getDayOfWeek().name().substring(0, 3);
            evolution.add(Map.of("date", dayName, "count", (int)count));
        }
        return evolution;
    }

    private List<Map<String, Object>> calculateOrdersByStatus() {
        long delivered = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long inProgress = orderRepository.countByStatus(OrderStatus.ON_THE_WAY) + orderRepository.countByStatus(OrderStatus.PICKUP_READY) + orderRepository.countByStatus(OrderStatus.ASSIGNED);
        long pending = orderRepository.countByStatus(OrderStatus.PENDING);
        long issue = orderRepository.countByStatus(OrderStatus.FAILED);

        return List.of(
            Map.of("name", "Livrée", "value", (int)delivered, "color", "#10b981"),
            Map.of("name", "En cours", "value", (int)inProgress, "color", "#3b82f6"),
            Map.of("name", "En attente", "value", (int)pending, "color", "#f59e0b"),
            Map.of("name", "Problème", "value", (int)issue, "color", "#ef4444")
        );
    }

    private Double calculateTrend(long current, long previous) {
        if (previous == 0) return current > 0 ? 100.0 : 0.0;
        return ((double) (current - previous) / previous) * 100.0;
    }

    @Override
    public FinanceResponse getFinanceStats() {
        BigDecimal total = orderRepository.sumTotalCod();
        BigDecimal pending = orderRepository.sumPendingCod();
        BigDecimal paid = orderRepository.sumPaidCod();

        Page<Transaction> recentTransactions = transactionRepository.findAll(
                PageRequest.of(0, 10, Sort.by("date").descending()));
        
        List<TransactionResponse> txList = recentTransactions.getContent().stream()
                .map(transactionMapper::toResponse)
                .collect(Collectors.toList());

        return FinanceResponse.builder()
                .totalCod(total != null ? total : BigDecimal.ZERO)
                .pendingCod(pending != null ? pending : BigDecimal.ZERO)
                .paidCod(paid != null ? paid : BigDecimal.ZERO)
                .transactions(txList)
                .build();
    }

    @Override
    public List<OrderResponse> batchAssignOrders(BatchAssignRequest request) {
        Driver driver = driverRepository.findById(request.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", request.getDriverId().toString()));

        List<OrderResponse> results = new ArrayList<>();

        for (java.util.UUID orderId : request.getOrderIds()) {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

            // Create assignment history entry
            AssignmentHistory history = AssignmentHistory.builder()
                    .orderId(orderId)
                    .previousDriverId(order.getDriver() != null ? order.getDriver().getId() : null)
                    .newDriverId(driver.getId())
                    .reason(request.getAssignmentReason() != null ? request.getAssignmentReason() : "Bulk assignment by admin")
                    .assignedBy("ADMIN")
                    .status("ACTIVE")
                    .build();
            assignmentHistoryRepository.save(history);

            // Update order
            order.setDriver(driver);
            order.setLastAssignedAt(LocalDateTime.now());
            Order saved = orderRepository.save(order);
            results.add(orderMapper.toResponse(saved));

            // Realtime: Broadcast each assignment
            wsEventService.broadcastOrderUpdate(orderId, orderMapper.toResponse(saved));

            log.info("Order {} assigned to driver {} via batch operation", orderId, driver.getId());
        }

        return results;
    }

    @Override
    public OrderResponse reassignOrder(java.util.UUID orderId, ReassignOrderRequest request, String adminEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        Driver newDriver = driverRepository.findById(request.getNewDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", request.getNewDriverId().toString()));

        // Create assignment history entry
        AssignmentHistory history = AssignmentHistory.builder()
                .orderId(orderId)
                .previousDriverId(order.getDriver() != null ? order.getDriver().getId() : null)
                .newDriverId(newDriver.getId())
                .reason(request.getReason())
                .notes(request.getNotes())
                .assignedBy(adminEmail != null ? adminEmail : "ADMIN")
                .status("ACTIVE")
                .build();
        assignmentHistoryRepository.save(history);

        // Update order
        order.setDriver(newDriver);
        order.setReassignmentCount((order.getReassignmentCount() != null ? order.getReassignmentCount() : 0) + 1);
        order.setLastAssignedAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);

        log.info("Order {} reassigned from {} to {} by {}. Reason: {}",
                orderId,
                history.getPreviousDriverId(),
                newDriver.getId(),
                adminEmail,
                request.getReason());

        // Realtime: Broadcast reassignment to all watchers
        OrderResponse reassignResponse = orderMapper.toResponse(saved);
        wsEventService.broadcastOrderUpdate(orderId, reassignResponse);

        // Notify new driver
        if (newDriver.getUser() != null) {
            notificationService.createNotification(
                newDriver.getUser().getId(),
                "Nouvelle mission réassignée : " + order.getTrackingNumber(),
                "ASSIGNMENT"
            );
        }

        return reassignResponse;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentHistoryResponse> getOrderAssignmentHistory(java.util.UUID orderId) {
        // Verify order exists
        orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        List<AssignmentHistory> histories = assignmentHistoryRepository.findByOrderIdOrderByAssignedAtDesc(orderId);

        return histories.stream().map(history -> {
            String previousDriverName = "Unassigned";
            if (history.getPreviousDriverId() != null) {
                previousDriverName = driverRepository.findById(history.getPreviousDriverId())
                        .map(d -> d.getUser().getFirstName() + " " + d.getUser().getLastName())
                        .orElse("Unknown");
            }

            String newDriverName = driverRepository.findById(history.getNewDriverId())
                    .map(d -> d.getUser().getFirstName() + " " + d.getUser().getLastName())
                    .orElse("Unknown");

            return AssignmentHistoryResponse.builder()
                    .id(history.getId())
                    .orderId(history.getOrderId())
                    .previousDriverId(history.getPreviousDriverId())
                    .previousDriverName(previousDriverName)
                    .newDriverId(history.getNewDriverId())
                    .newDriverName(newDriverName)
                    .reason(history.getReason())
                    .notes(history.getNotes())
                    .assignedBy(history.getAssignedBy())
                    .status(history.getStatus())
                    .assignedAt(history.getAssignedAt())
                    .validUntil(history.getValidUntil())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TaskAnalyticsResponse getTaskAnalytics(String period) {
        return taskAnalyticsService.getTaskAnalytics(period != null ? period : "DAILY");
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverResponse> getLiveDrivers() {
        return driverRepository.findByAvailabilityNot(DriverAvailability.OFFLINE)
                .stream()
                .map(driverMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AuditLogResponse> getAuditLogs(String date, String action, String actor, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        // Simplified filtering for the demo/implementation
        Page<AuditLog> logPage;
        if (action != null && !action.isEmpty()) {
            logPage = auditLogRepository.findByActionContainingIgnoreCase(action, pageable);
        } else if (actor != null && !actor.isEmpty()) {
            logPage = auditLogRepository.findByActorEmailContainingIgnoreCase(actor, pageable);
        } else {
            logPage = auditLogRepository.findAll(pageable);
        }

        List<AuditLogResponse> content = logPage.getContent().stream()
                .map(auditLogMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<AuditLogResponse>builder()
                .content(content)
                .currentPage(page)
                .pageSize(size)
                .totalElements(logPage.getTotalElements())
                .totalPages(logPage.getTotalPages())
                .build();
    }
}
