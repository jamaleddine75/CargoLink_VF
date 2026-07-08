package com.deliveryplatform.integration;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderDeliveryIntegrationTest {

    @InjectMocks
    private OrderServiceImpl orderService;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private DriverRepository driverRepository;



    @Mock
    private PasswordEncoder passwordEncoder;
    
    @Mock
    private com.deliveryplatform.service.WalletService walletService;

    @Mock
    private com.deliveryplatform.mapper.OrderMapper orderMapper;

    @Mock
    private com.deliveryplatform.service.WebSocketEventService wsEventService;

    private User driverUser;
    private Driver driver;
    private Order order;

    @BeforeEach
    void setUp() {
        driverUser = User.builder()
                .id(UUID.randomUUID())
                .email("driver@cargolink.ma")
                .firstName("Driver")
                .role(Role.DRIVER)
                .build();

        driver = Driver.builder()
                .id(UUID.randomUUID())
                .user(driverUser)
                .status(DriverStatus.ONLINE)
                .build();

        order = Order.builder()
                .id(UUID.randomUUID())
                .trackingNumber("TRK-123")
                .status(OrderStatus.ON_THE_WAY)
                .driver(driver)
                .codAmount(BigDecimal.valueOf(100.00))
                .deliveryFee(BigDecimal.valueOf(20.00))
                .deliveryProofPin("$2a$10$validhashedpassword0000") // Mocked BCrypt hash
                .build();
    }

    @Test
    void testFullDeliveryWorkflowWithPin() throws Exception {
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(driverRepository.findByUserId(driverUser.getId())).thenReturn(Optional.of(driver));
        when(passwordEncoder.matches("0000", order.getDeliveryProofPin())).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        OrderResponse mockResponse = new OrderResponse();
        mockResponse.setStatus(OrderStatus.DELIVERED.name());
        when(orderMapper.toResponse(any(Order.class))).thenReturn(mockResponse);

        OrderResponse response = orderService.submitProofOfDelivery(
                order.getId(),
                driverUser.getId(),
                "pin",
                "0000",
                null,
                "Delivered successfully"
        );

        // Verify Status
        assertEquals(OrderStatus.DELIVERED.name(), response.getStatus());

        // Verify Wallet Update - this proves the integration point to wallet service
        verify(walletService, times(1)).handleOrderDelivery(any(Order.class), anyBoolean());
        

    }

    @Test
    void testWrongPinFails() {
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(driverRepository.findByUserId(driverUser.getId())).thenReturn(Optional.of(driver));
        when(passwordEncoder.matches("9999", order.getDeliveryProofPin())).thenReturn(false);

        assertThrows(com.deliveryplatform.exception.BadRequestException.class, () -> {
            orderService.submitProofOfDelivery(
                    order.getId(),
                    driverUser.getId(),
                    "pin",
                    "9999", // WRONG PIN
                    null,
                    "Failed delivery"
            );
        });
        
        // Order shouldn't be saved as DELIVERED
        assertEquals(OrderStatus.ON_THE_WAY, order.getStatus());
        verify(walletService, never()).handleOrderDelivery(any(), anyBoolean());
    }

    @Test
    void testMissingPinFails() {
        order.setDeliveryProofPin(null);
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(driverRepository.findByUserId(driverUser.getId())).thenReturn(Optional.of(driver));
        
        assertThrows(com.deliveryplatform.exception.BadRequestException.class, () -> {
            orderService.submitProofOfDelivery(
                    order.getId(),
                    driverUser.getId(),
                    "pin",
                    "0000",
                    null,
                    "Failed delivery"
            );
        });
        verify(walletService, never()).handleOrderDelivery(any(), anyBoolean());
    }

    @Test
    void testPlainTextPinFails() {
        order.setDeliveryProofPin("0000"); // Not a BCrypt hash (no $ prefix)
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(driverRepository.findByUserId(driverUser.getId())).thenReturn(Optional.of(driver));
        
        assertThrows(com.deliveryplatform.exception.BadRequestException.class, () -> {
            orderService.submitProofOfDelivery(
                    order.getId(),
                    driverUser.getId(),
                    "pin",
                    "0000",
                    null,
                    "Failed delivery"
            );
        });
        verify(walletService, never()).handleOrderDelivery(any(), anyBoolean());
    }
}
