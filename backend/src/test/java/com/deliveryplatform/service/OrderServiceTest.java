package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.dto.request.CreateOrderRequest;
import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.exception.BusinessException;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.exception.UnauthorizedException;
import com.deliveryplatform.mapper.OrderMapper;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.impl.OrderServiceImpl;
import com.deliveryplatform.service.validation.CashWorkflowValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private DriverRepository driverRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TrackingHistoryRepository trackingHistoryRepository;
    @Mock
    private IncidentRepository incidentRepository;
    @Mock
    private WalletService walletService;
    @Mock
    private DriverRatingRepository driverRatingRepository;
    @Mock
    private OrderMapper orderMapper;
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private CloudStorageService cloudStorageService;
    @Mock
    private PricingService pricingService;
    @Mock
    private CashWorkflowValidator cashWorkflowValidator;
    @Mock
    private NotificationService notificationService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuditService auditService;
    @Mock
    private WebSocketEventService wsEventService;
    @Mock
    private ShiftService shiftService;
    @Mock
    private jakarta.persistence.EntityManager entityManager;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User clientUser;
    private User driverUser;
    private Driver driver;
    private Order order;
    private UUID clientId;
    private UUID driverId;
    private UUID orderId;

    @BeforeEach
    void setUp() {
        clientId = UUID.randomUUID();
        driverId = UUID.randomUUID();
        orderId = UUID.randomUUID();

        clientUser = new User();
        clientUser.setId(clientId);
        clientUser.setEmail("client@test.com");
        clientUser.setRole(Role.CUSTOMER);

        driverUser = new User();
        driverUser.setId(driverId);
        driverUser.setEmail("driver@test.com");
        driverUser.setRole(Role.DRIVER);

        driver = new Driver();
        driver.setId(UUID.randomUUID());
        driver.setUser(driverUser);

        order = new Order();
        order.setId(orderId);
        order.setClient(clientUser);
        order.setStatus(OrderStatus.PENDING);
        order.setTrackingNumber("TRK-TEST-123");
        order.setCreatedAt(LocalDateTime.now());
        
        lenient().when(orderMapper.toResponse(any(Order.class))).thenAnswer(i -> {
            Order o = i.getArgument(0);
            OrderResponse res = new OrderResponse();
            res.setId(o.getId().toString());
            res.setStatus(o.getStatus().name());
            res.setTrackingNumber(o.getTrackingNumber());
            return res;
        });
    }

    @Test
    void createOrder_Success() {
        // Arrange
        CreateOrderRequest request = new CreateOrderRequest();
        request.setDeliveryFee(new BigDecimal("50.00"));
        request.setDistance(12.5);
        request.setPickupLat(33.0);
        request.setPickupLng(-7.0);
        request.setDeliveryLat(33.1);
        request.setDeliveryLng(-7.1);

        when(userRepository.findById(clientId)).thenReturn(Optional.of(clientUser));
        when(orderMapper.toEntity(any())).thenReturn(new Order());
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
            Order o = i.getArgument(0);
            o.setId(UUID.randomUUID());
            return o;
        });
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-pin");

        // Act
        OrderResponse response = orderService.createOrder(request, clientId);

        // Assert
        assertNotNull(response);
        verify(orderRepository, atLeastOnce()).save(any(Order.class));
        verify(pricingService).calculatePricing(any(Order.class));
        verify(notificationService).createNotification(eq(clientId), anyString(), eq("SUCCESS"));
        verify(auditService).logOrderAction(eq(clientId), any(), eq("ORDER_CREATED"), anyString());
        verify(wsEventService).broadcastNewOrder(any(OrderResponse.class));
    }

    @Test
    void acceptOrder_Success() {
        // Arrange
        when(orderRepository.findByIdWithLock(orderId)).thenReturn(Optional.of(order));
        when(driverRepository.findByUserId(driverId)).thenReturn(Optional.of(driver));
        when(orderRepository.findByDriverIdAndStatusIn(eq(driver.getId()), anyList())).thenReturn(Collections.emptyList());
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        // Act
        OrderResponse response = orderService.acceptOrder(orderId, driverId);

        // Assert
        assertEquals(OrderStatus.ASSIGNED.name(), response.getStatus());
        verify(orderRepository).save(order);
        verify(auditService).logOrderAction(eq(driverId), eq(orderId), eq("ORDER_ACCEPTED"), anyString());
        verify(wsEventService).broadcastOrderUpdate(eq(orderId), any(OrderResponse.class));
    }

    @Test
    void acceptOrder_ExceedsBatchLimit() {
        // Arrange
        when(orderRepository.findByIdWithLock(orderId)).thenReturn(Optional.of(order));
        when(driverRepository.findByUserId(driverId)).thenReturn(Optional.of(driver));
        
        List<Order> activeOrders = Arrays.asList(new Order(), new Order(), new Order());
        when(orderRepository.findByDriverIdAndStatusIn(eq(driver.getId()), anyList())).thenReturn(activeOrders);

        // Act & Assert
        BusinessException ex = assertThrows(BusinessException.class, () -> orderService.acceptOrder(orderId, driverId));
        assertTrue(ex.getMessage().contains("maximum limit of 3"));
    }

    @Test
    void updateOrderStatus_Unauthorized() {
        // Arrange
        order.setDriver(driver); // assigned to driver
        UUID otherUserId = UUID.randomUUID();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(driverRepository.findByUserId(otherUserId)).thenReturn(Optional.empty()); // Not found or different driver

        // Act & Assert
        assertThrows(UnauthorizedException.class, () -> 
            orderService.updateOrderStatus(orderId, otherUserId, "PICKUP_READY", null, null, null, null, null, false)
        );
    }

    @Test
    void refuseOrder_Success() {
        // Arrange
        order.setStatus(OrderStatus.ASSIGNED);
        order.setDriver(driver);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        // Act
        OrderResponse response = orderService.refuseOrder(orderId, driverId);

        // Assert
        assertEquals(OrderStatus.PENDING.name(), response.getStatus());
        assertNull(order.getDriver());
        verify(auditService).logOrderAction(eq(driverId), eq(orderId), eq("ORDER_REFUSED"), anyString());
        verify(wsEventService).broadcastOrderAvailable(any(OrderResponse.class));
    }
}
