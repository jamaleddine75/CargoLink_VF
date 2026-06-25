package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.exception.BadRequestException;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.impl.AgencyServiceImpl;
import com.deliveryplatform.service.impl.OrderServiceImpl;
import com.deliveryplatform.service.validation.CashWorkflowValidator;
import com.deliveryplatform.exception.ForbiddenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CashWorkflowServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private DriverRepository driverRepository;
    @Mock
    private AgencyRepository agencyRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AgencyWalletRepository agencyWalletRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private CashWorkflowValidator cashWorkflowValidator;
    @Mock
    private com.deliveryplatform.service.AuditService auditService;
    @Mock
    private com.deliveryplatform.service.AuditLogService auditLogService;
    @Mock
    private com.deliveryplatform.service.PlatformWalletService platformWalletService;
    @Mock
    private com.deliveryplatform.service.WebSocketEventService wsEventService;
    @Mock
    private com.deliveryplatform.service.NotificationService notificationService;
    @Mock
    private com.deliveryplatform.service.WalletService walletService;
    @Mock
    private com.deliveryplatform.service.AssignmentService assignmentService;
    @Mock
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    @Mock
    private com.deliveryplatform.mapper.OrderMapper orderMapper;


    @InjectMocks
    private OrderServiceImpl orderService;

    @InjectMocks
    private AgencyServiceImpl agencyService;

    private Order order;
    private Driver driver;
    private User driverUser;
    private Agency agency;
    private UUID userId;
    private UUID orderId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        orderId = UUID.randomUUID();
        agency = Agency.builder().id(UUID.randomUUID()).build();
        driverUser = User.builder().id(userId).build();
        driver = Driver.builder().id(UUID.randomUUID()).user(driverUser).agency(agency).build();
        order = Order.builder()
            .id(orderId)
                .status(OrderStatus.DELIVERED)
                .driver(driver)
                .agency(agency)
                .codAmount(new BigDecimal("100.00"))
                .cashCollected(false)
                .cashConfirmed(false)
                .build();
    }

    @Test
    void collectCash_Success() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(driverRepository.findByUserId(userId)).thenReturn(Optional.of(driver));
        when(orderRepository.save(any(Order.class))).thenReturn(order);
        doNothing().when(cashWorkflowValidator).validateForCollection(order);

        orderService.collectCash(orderId, userId);

        assertTrue(order.isCashCollected());
        assertNotNull(order.getCashCollectedAt());
        verify(cashWorkflowValidator).validateForCollection(order);
        verify(orderRepository).save(order);
    }

    @Test
    void collectCash_Fail_InvalidState() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(driverRepository.findByUserId(userId)).thenReturn(Optional.of(driver));
        doThrow(new BadRequestException("Invalid order state"))
                .when(cashWorkflowValidator).validateForCollection(order);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> 
            orderService.collectCash(orderId, userId)
        );

        assertEquals("Invalid order state", exception.getMessage());
    }

    @Test
    void confirmCash_Success() {
        order.setCashCollected(true);
        UUID adminId = UUID.randomUUID();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(agencyRepository.findByAdminAgencyId(adminId)).thenReturn(Optional.of(agency));
        when(userRepository.findById(adminId)).thenReturn(Optional.of(User.builder().id(adminId).build()));
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(Wallet.builder().user(driverUser).build()));
        when(agencyWalletRepository.findByAgencyId(agency.getId())).thenReturn(Optional.empty());
        when(agencyWalletRepository.save(any(AgencyWallet.class))).thenAnswer(i -> i.getArguments()[0]);
        doNothing().when(cashWorkflowValidator).validateForConfirmation(order);

        agencyService.confirmCashPayment(orderId, adminId, "ROLE_AGENCY_ADMIN");

        assertTrue(order.isCashConfirmed());
        assertNotNull(order.getCashConfirmedAt());
        assertEquals(PaymentStatus.CONFIRMED_BY_AGENCY, order.getPaymentStatus());
        verify(cashWorkflowValidator).validateForConfirmation(order);
        verify(orderRepository).save(order);
    }

    @Test
    void confirmCash_Fail_NotCollected() {
        UUID adminId = UUID.randomUUID();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(agencyRepository.findByAdminAgencyId(adminId)).thenReturn(Optional.of(agency));
        doThrow(new BadRequestException("Cash not collected yet"))
                .when(cashWorkflowValidator).validateForConfirmation(order);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> 
            agencyService.confirmCashPayment(orderId, adminId, "ROLE_AGENCY_ADMIN")
        );

        assertEquals("Cash not collected yet", exception.getMessage());
    }

    @Test
    void collectCash_Fail_DriverNotFound() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(driverRepository.findByUserId(userId)).thenReturn(Optional.empty());

        ForbiddenException exception = assertThrows(ForbiddenException.class, () -> 
            orderService.collectCash(orderId, userId)
        );

        assertEquals("Driver profile not found.", exception.getMessage());
    }

    @Test
    void collectCash_Fail_UnauthorizedDriver() {
        Driver otherDriver = Driver.builder().id(UUID.randomUUID()).build();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(driverRepository.findByUserId(userId)).thenReturn(Optional.of(otherDriver));

        ForbiddenException exception = assertThrows(ForbiddenException.class, () -> 
            orderService.collectCash(orderId, userId)
        );

        assertTrue(exception.getMessage().contains("not authorized"));
    }
}
