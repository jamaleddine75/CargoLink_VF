package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.OrderStatus;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.dto.response.CascadeETAResult;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.service.impl.ETAServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ETAServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ETAServiceImpl etaService;

    private UUID driverId;

    @BeforeEach
    void setUp() {
        driverId = UUID.randomUUID();
    }

    @Test
    void updateCascadeETA_calculatesCorrectSequence() {
        // Arrange
        Order o1 = createOrder(UUID.randomUUID(), 33.6, -7.6, 1);
        Order o2 = createOrder(UUID.randomUUID(), 33.7, -7.7, 2);
        when(orderRepository.findByDriverIdAndStatusIn(eq(driverId), any()))
            .thenReturn(new ArrayList<>(Arrays.asList(o1, o2)));
        when(orderRepository.findById(any())).thenReturn(Optional.of(o1), Optional.of(o2));

        // Act
        CascadeETAResult result = etaService.updateCascadeETA(driverId, 33.5, -7.5);

        // Assert
        assertNotNull(result);
        assertEquals(4, result.getStops().size()); // 2 Pickups + 2 Deliveries
        assertTrue(result.getStops().get(0).getEta().isBefore(result.getStops().get(1).getEta()));
        assertTrue(result.getStops().get(3).getEta().isAfter(LocalDateTime.now()));
    }

    @Test
    void updateCascadeETA_skipsCompletedStops() {
        // Arrange
        Order o1 = createOrder(UUID.randomUUID(), 33.6, -7.6, 1);
        o1.setStatus(OrderStatus.PICKED_UP); // Pickup already done
        
        when(orderRepository.findByDriverIdAndStatusIn(eq(driverId), any()))
            .thenReturn(Collections.singletonList(o1));
        when(orderRepository.findById(any())).thenReturn(Optional.of(o1));

        // Act
        CascadeETAResult result = etaService.updateCascadeETA(driverId, 33.5, -7.5);

        // Assert
        assertEquals(1, result.getStops().size());
        assertEquals("DELIVERY", result.getStops().get(0).getType());
    }

    @Test
    void processDelayAlerts_sendsNotificationOnlyOnce() {
        // Arrange
        User client = new User();
        client.setId(UUID.randomUUID());
        
        Order delayed = new Order();
        delayed.setTrackingNumber("TRK-DELAY");
        delayed.setStatus(OrderStatus.ON_THE_WAY);
        delayed.setDeadline(LocalDateTime.now().minusHours(1));
        delayed.setCurrentEta(LocalDateTime.now().plusHours(1));
        delayed.setDelayAlertSent(false);
        delayed.setClient(client);

        when(orderRepository.findByStatus(OrderStatus.ON_THE_WAY))
            .thenReturn(Collections.singletonList(delayed));

        // Act
        etaService.processDelayAlerts();
        etaService.processDelayAlerts(); // Call twice

        // Assert
        verify(notificationService, times(1)).createNotification(any(), any(), eq("DELAY_ALERT"));
        assertTrue(delayed.isDelayAlertSent());
    }

    @Test
    void updateCascadeETA_broadcastsWebSocket() {
        // Arrange
        Order o1 = createOrder(UUID.randomUUID(), 33.6, -7.6, 1);
        when(orderRepository.findByDriverIdAndStatusIn(eq(driverId), any()))
            .thenReturn(Collections.singletonList(o1));
        when(orderRepository.findById(any())).thenReturn(Optional.of(o1));

        // Act
        etaService.updateCascadeETA(driverId, 33.5, -7.5);

        // Assert
        ArgumentCaptor<CascadeETAResult> captor = ArgumentCaptor.forClass(CascadeETAResult.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/driver/" + driverId + "/eta"), captor.capture());
        
        CascadeETAResult payload = captor.getValue();
        assertTrue(payload.getTotalRemainingKm() > 0);
        assertNotNull(payload.getEstimatedEndTime());
    }

    private Order createOrder(UUID id, double lat, double lng, int seq) {
        Order order = new Order();
        order.setId(id);
        order.setTrackingNumber("TRK-" + id.toString().substring(0, 8));
        order.setDeliveryLat(lat);
        order.setDeliveryLng(lng);
        order.setPickupLat(lat - 0.01);
        order.setPickupLng(lng - 0.01);
        order.setSequenceIndex(seq);
        order.setStatus(OrderStatus.ASSIGNED);
        return order;
    }
}
