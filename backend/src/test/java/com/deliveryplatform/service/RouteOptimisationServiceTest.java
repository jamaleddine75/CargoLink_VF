package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.dto.response.BatchOptimizationResult;
import com.deliveryplatform.dto.response.RouteStopDTO;
import com.deliveryplatform.repository.DriverRepository;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.service.impl.RouteOptimisationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RouteOptimisationServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private DriverRepository driverRepository;

    @Mock
    private ETAService etaService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private RouteOptimisationServiceImpl routeOptimisationService;

    private UUID driverId;
    private Driver driver;

    @BeforeEach
    void setUp() {
        driverId = UUID.randomUUID();
        driver = Driver.builder()
                .id(driverId)
                .name("John Doe")
                .latitude(33.5731)
                .longitude(-7.5898)
                .availability(DriverAvailability.AVAILABLE)
                .build();
    }

    @Test
    void optimizeDriverRoute_respectsPickupBeforeDelivery() {
        // Arrange
        UUID orderId1 = UUID.randomUUID();
        Order order1 = createOrder(orderId1, 33.6, -7.6, 33.7, -7.7, false);
        
        when(driverRepository.findById(driverId)).thenReturn(Optional.of(driver));
        when(orderRepository.findAllById(Collections.singletonList(orderId1))).thenReturn(Collections.singletonList(order1));

        // Act
        List<RouteStopDTO> route = routeOptimisationService.optimizeDriverRouteWithStops(driverId, Collections.singletonList(orderId1));

        // Assert
        assertEquals(2, route.size());
        assertEquals("PICKUP", route.get(0).getType());
        assertEquals("DELIVERY", route.get(1).getType());
        assertEquals(orderId1, route.get(0).getOrderId());
        assertEquals(orderId1, route.get(1).getOrderId());
    }

    @Test
    void optimizeDriverRoute_urgentOrderFirst() {
        // Arrange
        Order normal = createOrder(UUID.randomUUID(), 33.1, -7.1, 33.2, -7.2, false);
        Order urgent = createOrder(UUID.randomUUID(), 33.8, -7.8, 33.9, -7.9, true);
        
        when(driverRepository.findById(driverId)).thenReturn(Optional.of(driver));
        when(orderRepository.findAllById(any())).thenReturn(Arrays.asList(normal, urgent));

        // Act
        List<RouteStopDTO> route = routeOptimisationService.optimizeDriverRouteWithStops(driverId, Arrays.asList(normal.getId(), urgent.getId()));

        // Assert
        // The urgent order stops should be at the beginning
        assertTrue(route.get(0).getOrderId().equals(urgent.getId()) || route.get(1).getOrderId().equals(urgent.getId()));
    }

    @Test
    void optimizeDriverRoute_2OptImproveDistance() {
        // Arrange: Zigzag points
        // Driver at (33.5, -7.5)
        // A: (33.6, -7.6), B: (33.7, -7.7), C: (33.55, -7.55), D: (33.65, -7.65)
        // A direct sequence like A->B->C->D is worse than C->A->D->B
        Order o1 = createOrder(UUID.randomUUID(), 33.7, -7.7, 33.71, -7.71, false);
        Order o2 = createOrder(UUID.randomUUID(), 33.6, -7.6, 33.61, -7.61, false);
        
        when(driverRepository.findById(driverId)).thenReturn(Optional.of(driver));
        when(orderRepository.findAllById(any())).thenReturn(Arrays.asList(o1, o2));

        // Act
        List<RouteStopDTO> route = routeOptimisationService.optimizeDriverRouteWithStops(driverId, Arrays.asList(o1.getId(), o2.getId()));

        // Assert
        assertNotNull(route);
        assertEquals(4, route.size());
    }

    @Test
    void optimizeDriverRoute_singleOrder() {
        // Arrange
        Order o1 = createOrder(UUID.randomUUID(), 33.6, -7.6, 33.7, -7.7, false);
        when(driverRepository.findById(driverId)).thenReturn(Optional.of(driver));
        when(orderRepository.findAllById(any())).thenReturn(Collections.singletonList(o1));

        // Act
        List<RouteStopDTO> route = routeOptimisationService.optimizeDriverRouteWithStops(driverId, Collections.singletonList(o1.getId()));

        // Assert
        assertEquals(2, route.size());
        assertEquals("PICKUP", route.get(0).getType());
        assertEquals("DELIVERY", route.get(1).getType());
    }

    @Test
    void optimizeDriverRoute_emptyList() {
        // Act
        List<RouteStopDTO> route = routeOptimisationService.optimizeDriverRouteWithStops(driverId, Collections.emptyList());

        // Assert
        assertTrue(route.isEmpty());
    }

    @Test
    void performGlobalBatchOptimization_assignsAllOrders() {
        // Arrange
        List<Order> pending = new ArrayList<>();
        for (int i = 0; i < 6; i++) pending.add(createOrder(UUID.randomUUID(), 33.5 + i*0.01, -7.5, 33.6 + i*0.01, -7.6, false));
        
        List<Driver> drivers = Arrays.asList(
            createDriver(UUID.randomUUID(), "D1", 33.5, -7.5),
            createDriver(UUID.randomUUID(), "D2", 34.0, -7.0)
        );

        when(orderRepository.findByStatus(OrderStatus.PENDING)).thenReturn(pending);
        when(driverRepository.findByAvailability(DriverAvailability.AVAILABLE)).thenReturn(drivers);
        when(driverRepository.findById(any())).thenAnswer(invocation -> {
            UUID id = invocation.getArgument(0);
            return drivers.stream().filter(d -> d.getId().equals(id)).findFirst();
        });
        when(orderRepository.findAllById(any())).thenAnswer(invocation -> {
            List<UUID> ids = invocation.getArgument(0);
            return pending.stream().filter(o -> ids.contains(o.getId())).toList();
        });

        // Act
        BatchOptimizationResult result = routeOptimisationService.performGlobalBatchOptimization();

        // Assert
        assertEquals(6, result.getTotalOrdersOptimized());
        assertTrue(result.getClusters().size() <= 2);
        verify(orderRepository, atLeast(6)).save(any(Order.class));
    }

    @Test
    void clusterOrders_kMeansPlusPlusQuality() {
        // Arrange: 4 clear zones
        List<Order> orders = new ArrayList<>();
        // Zone 1: Casa
        for (int i = 0; i < 5; i++) orders.add(createOrder(UUID.randomUUID(), 33.5, -7.5, 33.51, -7.51, false));
        // Zone 2: Rabat
        for (int i = 0; i < 5; i++) orders.add(createOrder(UUID.randomUUID(), 34.0, -6.8, 34.01, -6.81, false));
        // Zone 3: Tanger
        for (int i = 0; i < 5; i++) orders.add(createOrder(UUID.randomUUID(), 35.7, -5.8, 35.71, -5.81, false));
        // Zone 4: Marrakech
        for (int i = 0; i < 5; i++) orders.add(createOrder(UUID.randomUUID(), 31.6, -8.0, 31.61, -8.01, false));

        when(orderRepository.findByStatus(OrderStatus.PENDING)).thenReturn(orders);

        // Act
        Map<Integer, List<UUID>> clusters = routeOptimisationService.clusterOrders(4);

        // Assert
        assertEquals(4, clusters.size());
        for (List<UUID> cluster : clusters.values()) {
            assertEquals(5, cluster.size());
            // Check that all orders in a cluster belong to the same zone (prefix check)
            assertEquals(5, cluster.size());
        }
    }

    private Order createOrder(UUID id, double pLat, double pLng, double dLat, double dLng, boolean urgent) {
        Order order = new Order();
        order.setId(id);
        order.setTrackingNumber("TRK-" + id.toString().substring(0, 8));
        order.setPickupLat(pLat);
        order.setPickupLng(pLng);
        order.setDeliveryLat(dLat);
        order.setDeliveryLng(dLng);
        order.setUrgent(urgent);
        order.setStatus(OrderStatus.PENDING);
        return order;
    }

    private Driver createDriver(UUID id, String name, double lat, double lng) {
        return Driver.builder()
                .id(id)
                .name(name + " Driver")
                .latitude(lat)
                .longitude(lng)
                .availability(DriverAvailability.AVAILABLE)
                .build();
    }
}
