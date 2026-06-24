package com.deliveryplatform.service;

import com.deliveryplatform.dto.request.BatchAssignRequest;
import com.deliveryplatform.dto.request.ReassignOrderRequest;
import com.deliveryplatform.dto.response.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface GeneralAdminService {
    // User Management
    PagedResponse<UserResponse> getAllUsers(String role, String status, String search, Integer page, Integer size);
    List<UserResponse> getPendingUsers();
    void activateUser(UUID userId);
    void rejectUser(UUID userId, String reason);
    void suspendUser(UUID userId, boolean suspend);
    void blacklistUser(UUID userId, boolean blacklist);
    void deleteUser(UUID userId, boolean hardDelete);
    List<UserResponse> searchUsers(String query);

    // Order Management
    PagedResponse<OrderResponse> getOrders(String status, UUID driverId, LocalDateTime start, LocalDateTime end, Integer page, Integer size);
    void assignDriver(UUID orderId, UUID driverId);
    void updateOrderStatus(UUID orderId, String status);

    // Task Management - Bulk Operations
    List<OrderResponse> batchAssignOrders(BatchAssignRequest request);
    OrderResponse reassignOrder(UUID orderId, ReassignOrderRequest request, String adminEmail);
    List<AssignmentHistoryResponse> getOrderAssignmentHistory(UUID orderId);

    // Dashboard & Finance
    AdminDashboardResponse getDashboardStats();
    FinanceResponse getFinanceStats();

    // Analytics
    TaskAnalyticsResponse getTaskAnalytics(String period);

    List<DriverResponse> getLiveDrivers();

    PagedResponse<AuditLogResponse> getAuditLogs(String date, String action, String actor, Integer page, Integer size);
}
