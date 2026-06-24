package com.deliveryplatform.service;

import com.deliveryplatform.dto.request.CreateOrderRequest;
import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.dto.response.PagedResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.time.LocalDate;

public interface OrderService {
    PagedResponse<OrderResponse> getOrders(java.util.UUID driverId, String status, Integer page, Integer size);
    OrderResponse getOrderById(java.util.UUID id, java.util.UUID userId, String role);
    OrderResponse createOrder(CreateOrderRequest request, java.util.UUID clientId);
    OrderResponse updateOrderStatus(java.util.UUID orderId, java.util.UUID userId, String status, Double lat, Double lng, String photoUrl, String scanValue, String comment, Boolean codCollected);
    List<OrderResponse> batchUpdateOrderStatus(List<String> trackingNumbers, String status, Double lat, Double lng, String comment, java.util.UUID userId);
    OrderResponse acceptOrder(java.util.UUID orderId, java.util.UUID userId);
    OrderResponse refuseOrder(java.util.UUID orderId, java.util.UUID userId);
    OrderResponse collectCash(java.util.UUID orderId, java.util.UUID userId);
    OrderResponse reportProblem(java.util.UUID id, String category, String description);
    
    void rateDriver(java.util.UUID orderId, java.util.UUID clientId, Integer rating, String comment);
    List<?> getOrderTracking(java.util.UUID orderId);
    List<OrderResponse> getActiveOrder(java.util.UUID driverId);
    OrderResponse findByTrackingNumberForDriver(String trackingNumber, java.util.UUID driverId);
    OrderResponse findByTrackingNumber(String trackingNumber);
    PagedResponse<OrderResponse> getClientOrders(java.util.UUID clientId, String status, Integer page, Integer size);
    com.deliveryplatform.dto.response.ClientKPIsResponse getClientKPIs(java.util.UUID clientId);
    com.deliveryplatform.dto.response.DriverStatsResponse getDriverStats(java.util.UUID userId);
    void processOrder(java.util.UUID orderId);
    void generateRoute(java.util.UUID orderId);
    
    // Phase 5: Driver Delivery Endpoints
    PagedResponse<OrderResponse> getAvailableOrders(java.util.UUID userId, Integer page, Integer size);
    PagedResponse<OrderResponse> getDriverHistory(java.util.UUID userId, String status, LocalDate startDate, LocalDate endDate, Integer page, Integer size);
    java.util.Map<String, Object> getDriverDashboardStats(java.util.UUID driverId);
    OrderResponse assignOrderToDriver(java.util.UUID orderId, java.util.UUID driverId);
    OrderResponse submitProofOfDelivery(java.util.UUID orderId, java.util.UUID driverId, String proofMethod, String pinCode, MultipartFile photo, String notes) throws Exception;
    OrderResponse confirmPayment(java.util.UUID orderId, java.util.UUID userId);
    void updateSLAStatuses();
    void deleteAllOrders();
}
