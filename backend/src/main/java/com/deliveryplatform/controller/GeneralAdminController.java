package com.deliveryplatform.controller;

import com.deliveryplatform.dto.request.BatchAssignRequest;
import com.deliveryplatform.dto.request.ReassignOrderRequest;
import com.deliveryplatform.dto.response.*;
import com.deliveryplatform.service.GeneralAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class GeneralAdminController {

    private final GeneralAdminService adminService;

    // --- User Management ---

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size
    ) {
        if ("PENDING".equalsIgnoreCase(status)) {
            return ResponseEntity.ok(adminService.getPendingUsers());
        }
        return ResponseEntity.ok(adminService.getAllUsers(role, status, search, page, size));
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<Void> approveUser(@PathVariable UUID id) {
        adminService.activateUser(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/reject/{id}")
    public ResponseEntity<Void> rejectUser(@PathVariable UUID id, @RequestParam(required = false) String reason) {
        adminService.rejectUser(id, reason);
        return ResponseEntity.ok().build();
    }


    // --- Orders Management ---

    @GetMapping("/orders")
    public ResponseEntity<PagedResponse<OrderResponse>> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID driverId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size
    ) {
        return ResponseEntity.ok(adminService.getOrders(status, driverId, startDate, endDate, page, size));
    }

    @PutMapping("/orders/{id}/assign-driver")
    public ResponseEntity<Void> assignDriver(@PathVariable UUID id, @RequestParam UUID driverId) {
        adminService.assignDriver(id, driverId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Void> updateOrderStatus(@PathVariable UUID id, @RequestParam String status) {
        adminService.updateOrderStatus(id, status);
        return ResponseEntity.ok().build();
    }

    // --- Task Management - Bulk Operations ---

    @PostMapping("/orders/batch-assign")
    public ResponseEntity<List<OrderResponse>> batchAssignOrders(@RequestBody BatchAssignRequest request) {
        return ResponseEntity.ok(adminService.batchAssignOrders(request));
    }

    @PutMapping("/orders/{id}/reassign")
    public ResponseEntity<OrderResponse> reassignOrder(
            @PathVariable UUID id,
            @RequestBody ReassignOrderRequest request,
            Authentication authentication
    ) {
        String adminEmail = authentication != null ? authentication.getName() : "ADMIN";
        return ResponseEntity.ok(adminService.reassignOrder(id, request, adminEmail));
    }

    @GetMapping("/orders/{id}/assignment-history")
    public ResponseEntity<List<AssignmentHistoryResponse>> getOrderAssignmentHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.getOrderAssignmentHistory(id));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id, @RequestParam(defaultValue = "false") boolean hard) {
        adminService.deleteUser(id, hard);
        return ResponseEntity.ok().build();
    }

    // --- Analytics & Finance ---

    @GetMapping("/dashboard-stats")
    public ResponseEntity<AdminDashboardResponse> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/finance")
    public ResponseEntity<FinanceResponse> getFinanceStats() {
        return ResponseEntity.ok(adminService.getFinanceStats());
    }

    @GetMapping("/analytics/tasks")
    public ResponseEntity<TaskAnalyticsResponse> getTaskAnalytics(
            @RequestParam(defaultValue = "DAILY") String period
    ) {
        return ResponseEntity.ok(adminService.getTaskAnalytics(period));
    }

    @GetMapping("/live-drivers")
    public ResponseEntity<List<DriverResponse>> getLiveDrivers() {
        return ResponseEntity.ok(adminService.getLiveDrivers());
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam String q) {
        return ResponseEntity.ok(adminService.searchUsers(q));
    }

    @PutMapping("/users/{id}/suspend")
    public ResponseEntity<Void> suspendUser(@PathVariable UUID id, @RequestBody Map<String, Boolean> payload) {
        adminService.suspendUser(id, payload.get("suspend"));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/blacklist")
    public ResponseEntity<Void> blacklistUser(@PathVariable UUID id) {
        adminService.blacklistUser(id, true);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/unblacklist")
    public ResponseEntity<Void> unblacklistUser(@PathVariable UUID id) {
        adminService.blacklistUser(id, false);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/finance/transactions")
    public ResponseEntity<List<TransactionResponse>> getFinanceTransactions() {
        // Already part of getFinanceStats in service, but exposing a direct list here for the frontend.
        return ResponseEntity.ok(adminService.getFinanceStats().getTransactions());
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<PagedResponse<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String actor,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size
    ) {
        return ResponseEntity.ok(adminService.getAuditLogs(date, action, actor, page, size));
    }
}
