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
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.support.TransactionCallback;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WalletServiceTest {

    @Mock private WalletRepository walletRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private AgencyRepository agencyRepository;
    @Mock private AgencyWalletRepository agencyWalletRepository;
    @Mock private WithdrawalRequestRepository withdrawalRequestRepository;
    @Mock private AgencyPayoutRequestRepository agencyPayoutRequestRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private UserRepository userRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private WalletMapper walletMapper;
    @Mock private TransactionMapper transactionMapper;
    @Mock private com.deliveryplatform.service.PlatformWalletService platformWalletService;
    @Mock private com.deliveryplatform.service.AuditLogService auditLogService;
    @Mock private com.deliveryplatform.repository.DriverRepository driverRepository;
    @Mock private com.deliveryplatform.service.WebSocketEventService wsEventService;

    // FIX TEST-01: These four mocks were missing. WalletServiceImpl declares them as
    // final fields via @RequiredArgsConstructor. @InjectMocks injected null, causing NPE.
    @Mock private com.deliveryplatform.service.PaymentProvider paymentProvider;
    @Mock private com.deliveryplatform.repository.PaymentAccountRepository paymentAccountRepository;
    @Mock private com.deliveryplatform.service.ExchangeRateService exchangeRateService;
    @Mock private TransactionTemplate transactionTemplate;

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

        User agencyAdmin = new User();
        agencyAdmin.setId(UUID.randomUUID());
        agencyAdmin.setEmail("admin@agency.com");

        Wallet agencyAdminWallet = new Wallet();
        agencyAdminWallet.setUser(agencyAdmin);
        agencyAdminWallet.setBalance(BigDecimal.ZERO);
        agencyAdminWallet.setWalletType(WalletType.AGENCY);

        agency = Agency.builder()
                .id(agencyId)
                .name("Test Agency")
                .commissionRate(new BigDecimal("0.15"))
                .adminAgency(agencyAdmin)
                .build();

        driver = new Driver();
        driver.setUser(driverUser);
        driver.setAgency(agency);

        driverWallet = new Wallet();
        driverWallet.setUser(driverUser);
        driverWallet.setBalance(BigDecimal.ZERO);
        driverWallet.setWalletType(WalletType.DRIVER);

        // FIX TEST-03: Must initialize these fields to ZERO. handleOrderDelivery calls
        // agencyWallet.getTotalCommissionEarned().add(...) which NPEs on null.
        agencyWallet = new AgencyWallet();
        agencyWallet.setAgency(agency);
        agencyWallet.setBalance(BigDecimal.ZERO);
        agencyWallet.setTotalCommissionEarned(BigDecimal.ZERO);
        agencyWallet.setPendingCommission(BigDecimal.ZERO);
        agencyWallet.setTotalCollected(BigDecimal.ZERO);
        agencyWallet.setTotalRevenue(BigDecimal.ZERO);
        // FIX TEST-01: Configure TransactionTemplate mock to execute its callback synchronously
        org.mockito.Mockito.lenient().when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
            org.springframework.transaction.support.TransactionCallback<?> callback = invocation.getArgument(0);
            return callback.doInTransaction(new org.springframework.transaction.support.SimpleTransactionStatus());
        });
        agencyWallet.setPendingReceivables(BigDecimal.ZERO);
        agencyWallet.setPendingPayables(BigDecimal.ZERO);
        agencyWallet.setTotalPaidOut(BigDecimal.ZERO);
        agencyWallet.setCurrentBalance(BigDecimal.ZERO);

        // Standard lenient stubs used by multiple tests
        lenient().when(userRepository.findById(driverId)).thenReturn(Optional.of(driverUser));
        lenient().when(walletRepository.findByUserId(driverId)).thenReturn(Optional.of(driverWallet));
        lenient().when(walletRepository.findByUserIdWithLock(driverId)).thenReturn(Optional.of(driverWallet));
        lenient().when(walletRepository.findByUserId(agencyAdmin.getId())).thenReturn(Optional.of(agencyAdminWallet));
        lenient().when(walletRepository.findByUserIdWithLock(agencyAdmin.getId())).thenReturn(Optional.of(agencyAdminWallet));
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
        // FIX TEST-03: idempotency check - no pre-existing GAIN transaction
        when(transactionRepository.findByWalletUserIdAndTypeAndOrderId(driverId, TransactionType.GAIN, orderId))
                .thenReturn(Collections.emptyList());

        // Act
        walletService.handleOrderDelivery(order, false);

        // Assert: fee=100, admin=5%, remaining=95, agency=15% of 95=14.25, driver=80.75
        assertEquals(new BigDecimal("80.75"), driverWallet.getBalance());
        assertEquals(new BigDecimal("14.25"), agencyWallet.getBalance());

        ArgumentCaptor<Transaction> txCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, times(2)).save(txCaptor.capture());
        
        List<Transaction> savedTxs = txCaptor.getAllValues();
        assertTrue(savedTxs.stream().anyMatch(t -> t.getType() == TransactionType.GAIN));
        assertTrue(savedTxs.stream().anyMatch(t -> t.getType() == TransactionType.COMMISSION));

        verify(messagingTemplate).convertAndSend(eq("/topic/wallet/" + driverId), any(Map.class));
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
        when(transactionRepository.findByWalletUserIdAndTypeAndOrderId(driverId, TransactionType.GAIN, orderId))
                .thenReturn(Collections.emptyList());

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
        assertEquals(new BigDecimal("600"), codTx.get().getAmount()); // codAmount + deliveryFee
        assertEquals(PaymentStatus.COLLECTED_BY_DRIVER, order.getPaymentStatus());
    }

    /**
     * FIX TEST-02 (regression): createWithdrawalRequest is the real payout entry point.
     * requestPayout was deprecated; calling createWithdrawalRequest with insufficient balance
     * should throw BusinessException.
     */
    @Test
    void createWithdrawalRequest_InsufficientBalance() {
        // Arrange: wallet balance is only 50, minimum is 200, but we test the balance check
        driverWallet.setBalance(new BigDecimal("300")); // above minimum
        // Simulate wallet found with lock
        when(walletRepository.findByUserIdWithLock(driverId)).thenReturn(Optional.of(driverWallet));
        // No in-flight requests
        org.mockito.Mockito.lenient().when(withdrawalRequestRepository.existsByUserIdAndStatusIn(eq(driverId), any())).thenReturn(false);
        // No payment account found
        org.mockito.Mockito.lenient().when(paymentAccountRepository.findById(any())).thenReturn(Optional.empty());

        // Try to withdraw 500 when balance is 300
        BusinessException ex = assertThrows(BusinessException.class, () ->
            walletService.createWithdrawalRequest(driverId, new BigDecimal("500"), UUID.randomUUID())
        );
        assertTrue(ex.getMessage().contains("Insufficient"));
    }

    @Test
    void createWithdrawalRequest_BelowMinimum() {
        // Act & Assert: 50 DH < 200 DH minimum
        assertThrows(BusinessException.class, () ->
            walletService.createWithdrawalRequest(driverId, new BigDecimal("50"), UUID.randomUUID())
        );
        // Should not touch the repository at all
        verifyNoInteractions(walletRepository);
    }

    @Test
    void createWithdrawalRequest_WalletFrozen() {
        // Arrange
        driverWallet.setBalance(new BigDecimal("500"));
        driverWallet.setFrozen(true);
        when(walletRepository.findByUserIdWithLock(driverId)).thenReturn(Optional.of(driverWallet));

        // Act & Assert
        BusinessException ex = assertThrows(BusinessException.class, () ->
            walletService.createWithdrawalRequest(driverId, new BigDecimal("200"), UUID.randomUUID())
        );
        assertTrue(ex.getMessage().contains("frozen"));
    }

    /**
     * FIX PP-05 (regression): Verify that a second concurrent withdrawal is rejected
     * when a PENDING/PROCESSING one already exists.
     */
    @Test
    void createWithdrawalRequest_DuplicatePrevented() {
        // Arrange
        driverWallet.setBalance(new BigDecimal("1000"));
        when(walletRepository.findByUserIdWithLock(driverId)).thenReturn(Optional.of(driverWallet));
        // Simulate an in-flight withdrawal already in PENDING state
        when(withdrawalRequestRepository.existsByUserIdAndStatusIn(eq(driverId), any())).thenReturn(true);

        // Act & Assert
        BusinessException ex = assertThrows(BusinessException.class, () ->
            walletService.createWithdrawalRequest(driverId, new BigDecimal("200"), UUID.randomUUID())
        );
        assertTrue(ex.getMessage().contains("already in progress"));
    }

    /**
     * FIX WC-04 (regression): Verify that a second call to handleOrderDelivery for the
     * same order does NOT credit the driver a second time.
     */
    @Test
    void handleOrderDelivery_Idempotent_NoDoubleCredit() {
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

        // Simulate: GAIN transaction already exists (second call)
        Transaction existingGain = Transaction.builder()
                .id(UUID.randomUUID()).type(TransactionType.GAIN).amount(new BigDecimal("80.75"))
                .status(TransactionStatus.COMPLETED).orderId(orderId).build();
        when(transactionRepository.findByWalletUserIdAndTypeAndOrderId(driverId, TransactionType.GAIN, orderId))
                .thenReturn(Collections.singletonList(existingGain));

        BigDecimal balanceBefore = driverWallet.getBalance();

        // Act: second delivery event
        walletService.handleOrderDelivery(order, false);

        // Assert: balance unchanged (no double credit)
        assertEquals(balanceBefore, driverWallet.getBalance(),
                "Balance must not change when GAIN already recorded for this order");
        // No GAIN transaction should be saved a second time
        verify(transactionRepository, never()).save(argThat(tx -> tx.getType() == TransactionType.GAIN));
    }

    /**
     * FIX PP-02 (regression): Verify that finalizeSuccessfulWithdrawal does NOT
     * deduct balance again (balance should remain unchanged after the webhook call).
     */
    @Test
    void finalizeSuccessfulWithdrawal_DoesNotDeductBalanceTwice() {
        // Arrange: balance after request creation (already deducted)
        driverWallet.setBalance(new BigDecimal("300")); // 500 original - 200 already deducted

        UUID withdrawalId = UUID.randomUUID();
        WithdrawalRequest wr = new WithdrawalRequest();
        wr.setId(withdrawalId);
        wr.setAmount(new BigDecimal("200"));
        wr.setStatus(TransactionStatus.PROCESSING);
        wr.setUser(driverUser);

        when(withdrawalRequestRepository.findById(withdrawalId)).thenReturn(Optional.of(wr));
        when(transactionRepository.findByWalletUserIdAndTypeAndStatus(
                driverId, TransactionType.PAYOUT, TransactionStatus.PROCESSING))
                .thenReturn(Collections.emptyList());

        // Act
        walletService.finalizeSuccessfulWithdrawal(withdrawalId, "PAYPAL_ITEM_123");

        // Assert: wallet repository must NOT have been touched for balance deduction
        verify(walletRepository, never()).save(any(Wallet.class));
        assertEquals(new BigDecimal("300"), driverWallet.getBalance(),
                "Balance must NOT be deducted again during webhook finalization");

        // Withdrawal request status updated to COMPLETED
        assertEquals(TransactionStatus.COMPLETED, wr.getStatus());
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
        
        lenient().when(transactionRepository.findByWalletUserIdAndTypeAndStatus(eq(driverId), eq(TransactionType.COD_REMIS), eq(TransactionStatus.PENDING)))
            .thenReturn(Collections.emptyList());
        
        when(transactionRepository.findByWalletUserIdAndTypeAndStatus(eq(driverId), eq(TransactionType.COD_COLLECTED), eq(TransactionStatus.PENDING)))
            .thenReturn(Arrays.asList(codCollect1, codCollect2));

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
        
        // Verify COD_REMIS created in PENDING state
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
