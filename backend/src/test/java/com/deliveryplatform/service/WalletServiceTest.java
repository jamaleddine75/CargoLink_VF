package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.exception.BusinessException;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.impl.WalletServiceImpl;
import com.deliveryplatform.mapper.WalletMapper;
import com.deliveryplatform.mapper.TransactionMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WalletServiceTest {

    @Mock
    private WalletRepository walletRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private AgencyRepository agencyRepository;
    @Mock
    private AgencyWalletRepository agencyWalletRepository;
    @Mock
    private WithdrawalRequestRepository withdrawalRequestRepository;
    @Mock
    private AgencyPayoutRequestRepository agencyPayoutRequestRepository;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private WalletMapper walletMapper;
    @Mock
    private TransactionMapper transactionMapper;
    @Mock
    private com.deliveryplatform.service.PlatformWalletService platformWalletService;
    @Mock
    private com.deliveryplatform.service.AuditLogService auditLogService;
    @Mock
    private com.deliveryplatform.repository.DriverRepository driverRepository;
    @Mock
    private com.deliveryplatform.service.WebSocketEventService wsEventService;


    @InjectMocks
    private WalletServiceImpl walletService;

    private User driverUser;
    private Driver driver;
    private Wallet driverWallet;
    private Agency agency;
    private AgencyWallet agencyWallet;
    private UUID driverId;
    private UUID agencyId;

    @BeforeEach
    void setUp() {
        driverId = UUID.randomUUID();
        agencyId = UUID.randomUUID();

        driverUser = new User();
        driverUser.setId(driverId);
        driverUser.setEmail("driver@test.com");

        driver = new Driver();
        driver.setUser(driverUser);
        driver.setAgency(agency); // CRITICAL: ensures commission logic is triggered

        driverWallet = new Wallet();
        driverWallet.setUser(driverUser);
        driverWallet.setBalance(BigDecimal.ZERO);
        driverWallet.setWalletType(WalletType.DRIVER);

        agency = Agency.builder()
                .id(agencyId)
                .name("Test Agency")
                .commissionRate(new BigDecimal("0.15"))
                .build();
        
        driver.setAgency(agency); // Set it again just in case

        agencyWallet = new AgencyWallet();
        agencyWallet.setAgency(agency);
        agencyWallet.setBalance(BigDecimal.ZERO);

        // Standard mock to prevent ResourceNotFoundException in createDefaultWallet
        lenient().when(userRepository.findById(driverId)).thenReturn(Optional.of(driverUser));
        lenient().when(walletRepository.findByUserId(driverId)).thenReturn(Optional.of(driverWallet));
        lenient().when(walletRepository.findByUserIdWithLock(driverId)).thenReturn(Optional.of(driverWallet));
    }

    @Test
    void handleOrderDelivery_NominalCase() {
        // Arrange
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
            .id(orderId)
                .deliveryFee(new BigDecimal("100"))
                .driver(driver)
                .agency(agency)
                .status(OrderStatus.DELIVERED)
                .build();

        when(agencyWalletRepository.findByAgencyId(agencyId)).thenReturn(Optional.of(agencyWallet));

        // Act
        walletService.handleOrderDelivery(order, false);

        // Assert
        assertEquals(new BigDecimal("85.00"), driverWallet.getBalance());
        assertEquals(new BigDecimal("15.00"), agencyWallet.getBalance());

        ArgumentCaptor<Transaction> txCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, times(2)).save(txCaptor.capture());
        
        List<Transaction> savedTxs = txCaptor.getAllValues();
        assertTrue(savedTxs.stream().anyMatch(t -> t.getType() == TransactionType.GAIN));
        assertTrue(savedTxs.stream().anyMatch(t -> t.getType() == TransactionType.COMMISSION));

        verify(messagingTemplate).convertAndSend(eq("/topic/orders"), any(Map.class));
    }

    @Test
    void handleOrderDelivery_WithCOD() {
        // Arrange
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
            .id(orderId)
                .deliveryFee(new BigDecimal("100"))
                .codAmount(new BigDecimal("500"))
                .driver(driver)
                .agency(agency)
                .build();

        when(agencyWalletRepository.findByAgencyId(agencyId)).thenReturn(Optional.of(agencyWallet));

        // Act
        walletService.handleOrderDelivery(order, true);

        // Assert
        ArgumentCaptor<Transaction> txCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, atLeast(3)).save(txCaptor.capture());

        List<Transaction> savedTxs = txCaptor.getAllValues();
        Optional<Transaction> codTx = savedTxs.stream()
                .filter(t -> t.getType() == TransactionType.COD_COLLECTED)
                .findFirst();

        assertTrue(codTx.isPresent());
        assertEquals(TransactionStatus.PENDING, codTx.get().getStatus());
        assertEquals(new BigDecimal("500"), codTx.get().getAmount());
        assertEquals(PaymentStatus.COLLECTED_BY_DRIVER, order.getPaymentStatus());
    }

    @Test
    void requestPayout_InsufficientBalance() {
        // Arrange
        driverWallet.setBalance(new BigDecimal("50"));

        // Act & Assert
        assertThrows(BusinessException.class, () -> 
            walletService.requestPayout(driverId, new BigDecimal("100"), "IBAN123")
        );
    }

    @Test
    void requestPayout_WalletFrozen() {
        // Arrange: wallet must have sufficient balance (>= 100 MAD) so the frozen check
        // is reached before the minimum-withdrawal-amount validation.
        driverWallet.setBalance(new BigDecimal("500"));
        driverWallet.setFrozen(true);

        // Act & Assert
        BusinessException ex = assertThrows(BusinessException.class, () ->
            walletService.requestPayout(driverId, new BigDecimal("100"), "IBAN123")
        );
        assertTrue(ex.getMessage().contains("frozen"));
    }

    @Test
    void requestPayout_ConcurrentAccess_UsesLock() {
        // Arrange
        driverWallet.setBalance(new BigDecimal("1000"));

        // Act
        walletService.requestPayout(driverId, new BigDecimal("100"), "IBAN123");

        // Assert
        verify(walletRepository).findByUserIdWithLock(driverId);
    }

    @Test
    void declareCODRemittance_OrderNotDelivered() {
        // Arrange
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
            .id(orderId)
                .status(OrderStatus.ON_THE_WAY)
                .trackingNumber("TRK-001")
                .build();
        
        when(orderRepository.findAllById(any())).thenReturn(Collections.singletonList(order));

        // Act & Assert
        assertThrows(BusinessException.class, () -> 
            walletService.declareCODRemittance(driverId, Collections.singletonList(orderId), new BigDecimal("500"))
        );
    }

    @Test
    void declareCODRemittance_NominalCase() {
        // Arrange
        UUID orderId1 = UUID.randomUUID();
        UUID orderId2 = UUID.randomUUID();
        List<Order> orders = Arrays.asList(
            Order.builder().id(orderId1).status(OrderStatus.DELIVERED).codCollected(true).codAmount(new BigDecimal("100")).build(),
            Order.builder().id(orderId2).status(OrderStatus.DELIVERED).codCollected(true).codAmount(new BigDecimal("200")).build()
        );
        
        when(orderRepository.findAllById(any())).thenReturn(orders);
        
        Transaction codCollect1 = Transaction.builder().id(UUID.randomUUID()).type(TransactionType.COD_COLLECTED).status(TransactionStatus.PENDING).orderId(orderId1).build();
        Transaction codCollect2 = Transaction.builder().id(UUID.randomUUID()).type(TransactionType.COD_COLLECTED).status(TransactionStatus.PENDING).orderId(orderId2).build();
        
        when(transactionRepository.findByWalletUserIdAndTypeAndStatus(eq(driverId), eq(TransactionType.COD_COLLECTED), eq(TransactionStatus.PENDING)))
            .thenReturn(Arrays.asList(codCollect1, codCollect2));

        // Mock save to return a transaction with an ID (prevents NPE in Map.of)
        lenient().when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> {
            Transaction t = i.getArgument(0);
            if (t.getId() == null) t.setId(UUID.randomUUID());
            return t;
        });

        // Act
        walletService.declareCODRemittance(driverId, Arrays.asList(orderId1, orderId2), new BigDecimal("300"));

        // Assert
        ArgumentCaptor<Transaction> txCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, atLeastOnce()).save(txCaptor.capture());
        
        List<Transaction> savedTxs = txCaptor.getAllValues();
        
        // Verify COD_REMIS created
        assertTrue(savedTxs.stream().anyMatch(t -> t.getType() == TransactionType.COD_REMIS && t.getStatus() == TransactionStatus.PENDING));
        
        // Verify original COD_COLLECTED marked as REMITTED
        assertEquals(TransactionStatus.REMITTED, codCollect1.getStatus());
        assertEquals(TransactionStatus.REMITTED, codCollect2.getStatus());
    }

    @Test
    void reconcileDailyBatch_RunsWithoutException() {
        // Arrange
        when(orderRepository.findByPaymentStatus(PaymentStatus.CONFIRMED_BY_AGENCY)).thenReturn(Collections.emptyList());

        // Act & Assert
        assertDoesNotThrow(() -> walletService.reconcileDailyBatch());
    }
}
