package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.dto.response.*;
import com.deliveryplatform.exception.BadRequestException;
import com.deliveryplatform.exception.BusinessException;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.mapper.TransactionMapper;
import com.deliveryplatform.mapper.WalletMapper;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.AuditLogService;
import com.deliveryplatform.service.PlatformFinanceSettingsService;
import com.deliveryplatform.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final OrderRepository orderRepository;
    private final AgencyRepository agencyRepository;
    private final AgencyWalletRepository agencyWalletRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final AgencyPayoutRequestRepository agencyPayoutRequestRepository;
    private final UserRepository userRepository;
    private final WalletMapper walletMapper;
    private final TransactionMapper transactionMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuditLogService auditLogService;
    private final com.deliveryplatform.service.PlatformWalletService platformWalletService;
    private final DriverRepository driverRepository;
    private final com.deliveryplatform.service.WebSocketEventService wsEventService;
    private final com.deliveryplatform.service.PaymentProvider paymentProvider;
    private final com.deliveryplatform.repository.PaymentAccountRepository paymentAccountRepository;
    private final com.deliveryplatform.service.ExchangeRateService exchangeRateService;
    private final TransactionTemplate transactionTemplate;
    private final PlatformFinanceSettingsService platformFinanceSettingsService;

    // =========================================================================
    // SECTION: DRIVER WALLET & EARNINGS
    // =========================================================================

    @Override
    public WalletResponse getDriverBalance(UUID userId) {
        log.debug("Fetching balance for user: {}", userId);
        return getWalletByUserId(userId);
    }

    @Override
    public WalletResponse getWalletByUserId(UUID userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultWallet(userId));

        BigDecimal pendingCOD = transactionRepository.findByWalletUserIdAndTypeAndStatus(
                userId, TransactionType.COD_COLLECTED, TransactionStatus.PENDING)
                .stream()
                .filter(Objects::nonNull)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal deductions = transactionRepository.findByWalletUserIdAndType(
                userId, TransactionType.DEDUCTION)
                .stream()
                .filter(Objects::nonNull)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEarned = transactionRepository.findByWalletUserIdAndTypeIn(
                userId, Arrays.asList(TransactionType.GAIN, TransactionType.BONUS))
                .stream()
                .filter(Objects::nonNull)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Compute totalEarned from transaction ledger — do NOT override with raw order sums.
        // Order-sum fallback causes cashInHand/debtToSystem to grow without remittance recognition.
        UUID driverId = driverRepository.findByUserId(userId).map(Driver::getId).orElse(null);
        long totalDeliveries = driverId != null ? orderRepository.countByDriverIdAndStatus(driverId, OrderStatus.DELIVERED) : 0;

        BigDecimal todayEarnings = getDailyEarnings(userId);

        BigDecimal monthlyEarnings = transactionRepository.findByWalletUserIdAndTypeInAndDateGreaterThan(
                userId, Arrays.asList(TransactionType.GAIN, TransactionType.BONUS), LocalDateTime.now().minus(30, ChronoUnit.DAYS))
                .stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal weeklyEarnings = calculateWeeklyCommission(userId);

        WalletResponse response = walletMapper.toResponse(wallet);
        // Trust wallet entity fields — these are maintained transactionally.
        response.setCashInHand(wallet.getCashInHand() != null ? wallet.getCashInHand() : BigDecimal.ZERO);
        response.setDebtToSystem(wallet.getDebtToSystem() != null ? wallet.getDebtToSystem() : BigDecimal.ZERO);
        response.setTotalEarned(totalEarned);
        response.setTodayEarnings(todayEarnings != null ? todayEarnings : BigDecimal.ZERO);
        response.setPendingCOD(pendingCOD != null ? pendingCOD : BigDecimal.ZERO);
        response.setPendingCodTotal(pendingCOD != null ? pendingCOD : BigDecimal.ZERO);
        response.setWeeklyEarnings(weeklyEarnings != null ? weeklyEarnings : BigDecimal.ZERO);
        response.setMonthlyEarnings(monthlyEarnings != null ? monthlyEarnings : BigDecimal.ZERO);
        response.setTotalDeliveries((int) totalDeliveries);
        response.setDeductions(deductions != null ? deductions : BigDecimal.ZERO);
        response.setWeeklyCommission(weeklyEarnings != null ? weeklyEarnings : BigDecimal.ZERO);

        // Account metadata
        response.setAccountStatus(wallet.isFrozen() ? "FROZEN" : "VERIFIED");
        
        LocalDate today = LocalDate.now();
        int daysUntilMonday = (8 - today.getDayOfWeek().getValue()) % 7;
        if (daysUntilMonday == 0) daysUntilMonday = 7;
        response.setNextPayoutDate(today.plusDays(daysUntilMonday));
        
        return response;
    }

    @Override
    public PagedResponse<TransactionResponse> getTransactions(UUID userId, Integer page, Integer size, String type, 
                                                               String period, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : getStartDateForPeriod(period);
        LocalDateTime end = endDate != null ? endDate.plusDays(1).atStartOfDay() : LocalDateTime.now();

        Page<Transaction> txPage;
        if (type != null && !type.isEmpty()) {
            try {
                TransactionType txType = TransactionType.valueOf(type);
                txPage = transactionRepository.findByWalletUserIdAndTypeAndDateBetween(
                        userId, txType, start, end, PageRequest.of(page, size, Sort.by("date").descending()));
            } catch (IllegalArgumentException e) {
                log.error("Invalid TransactionType: {}. Falling back to all types.", type);
                txPage = transactionRepository.findByWalletUserIdAndDateBetween(
                        userId, start, end, PageRequest.of(page, size, Sort.by("date").descending()));
            }
        } else {
            txPage = transactionRepository.findByWalletUserIdAndDateBetween(
                    userId, start, end, PageRequest.of(page, size, Sort.by("date").descending()));
        }

        List<TransactionResponse> content = txPage.getContent().stream()
                .map(transactionMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<TransactionResponse>builder()
                .content(content)
                .currentPage(page)
                .pageSize(size)
                .totalElements(txPage.getTotalElements())
                .totalPages(txPage.getTotalPages())
                .last(txPage.isLast())
                .build();
    }

    @Override
    public List<TransactionResponse> getPendingCOD(UUID userId) {
        // 1. Get existing pending transactions
        List<Transaction> transactions = transactionRepository.findByWalletUserIdAndTypeAndStatus(
                userId, TransactionType.COD_COLLECTED, TransactionStatus.PENDING);
        
        Set<UUID> transactionOrderIds = transactions.stream()
                .map(Transaction::getOrderId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<TransactionResponse> responses = transactions.stream().map(tx -> {
            TransactionResponse resp = transactionMapper.toResponse(tx);
            if (tx.getOrderId() != null) {
                orderRepository.findById(tx.getOrderId()).ifPresent(order -> {
                    resp.setTrackingNumber(order.getTrackingNumber());
                    resp.setDeliveryAddress(order.getDeliveryAddress());

                    resp.setAmount(calculateAmountToRemit(order));
                    resp.setCodAmount(order.getCodAmount());
                });
            } else {
                resp.setCodAmount(tx.getAmount());
            }
            return resp;
        }).collect(Collectors.toList());

        // 2. Add fallback for delivered orders with COD that are missing a transaction
        // This fixes the "missing parcels for remittance" issue if background processing failed.
        UUID driverId = driverRepository.findByUserId(userId).map(Driver::getId).orElse(null);
        if (driverId != null) {
            List<Order> missingOrders = orderRepository.findByDriverIdAndStatusIn(driverId, List.of(OrderStatus.DELIVERED))
                    .stream()
                    .filter(o -> Boolean.TRUE.equals(o.isCodCollected()) && o.getCodAmount() != null && o.getCodAmount().compareTo(BigDecimal.ZERO) > 0)
                    .filter(o -> !transactionOrderIds.contains(o.getId()))
                    .filter(o -> {
                        // Ensure no COD_REMIS transaction exists for this order already
                        return transactionRepository.findByWalletUserIdAndTypeAndOrderId(userId, TransactionType.COD_REMIS, o.getId()).isEmpty();
                    })
                    .toList();

            for (Order o : missingOrders) {
                BigDecimal amountToRemit = calculateAmountToRemit(o);
                
                responses.add(TransactionResponse.builder()
                        .id(UUID.randomUUID()) // Virtual ID
                        .amount(amountToRemit)
                        .codAmount(o.getCodAmount())
                        .type(TransactionType.COD_COLLECTED.name())
                        .status(TransactionStatus.PENDING.name())
                        .description("Cash Collected To Remit (Auto-detected) - " + o.getTrackingNumber())
                        .date(o.getDeliveredAt())
                        .trackingNumber(o.getTrackingNumber())
                        .deliveryAddress(o.getDeliveryAddress())
                        .orderId(o.getId())
                        .build());
            }
        }
        
        return responses;
    }

    @Override
    public Map<String, Object> declareCODRemittance(UUID userId, List<UUID> orderIds, BigDecimal totalAmount) {
        Wallet wallet = walletRepository.findByUserId(userId)
            .orElseGet(() -> createDefaultWallet(userId));

        validateAmount(totalAmount);

        // Check for existing pending remittance for these orders
        List<Transaction> pendingRemittances = transactionRepository.findByWalletUserIdAndTypeAndStatus(
            userId, TransactionType.COD_REMIS, TransactionStatus.PENDING);
        
        for (Transaction pr : pendingRemittances) {
            if (pr.getReferenceIds() != null) {
                List<String> existingIds = Arrays.asList(pr.getReferenceIds().split(","));
                if (orderIds.stream().anyMatch(id -> existingIds.contains(id.toString()))) {
                    throw new BusinessException("Un ou plusieurs colis sont déjà présents dans une remise en attente.");
                }
            }
        }

        List<Order> orders = orderRepository.findAllById(orderIds);
        for (Order order : orders) {
            if (!order.isCodCollected()) {
                throw new BusinessException("Order " + order.getId() + " COD not yet collected");
            }
            if (order.getStatus() != OrderStatus.DELIVERED) {
                throw new BusinessException("Order " + order.getId() + " is not delivered yet");
            }
        }

        BigDecimal expectedRemittance = orders.stream()
            .map(this::calculateAmountToRemit)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalAmount.compareTo(expectedRemittance) != 0) {
            throw new BusinessException("Le montant déclaré (" + totalAmount + ") ne correspond pas au montant attendu à remettre (" + expectedRemittance + ")");
        }

        BigDecimal grossCollected = orders.stream()
            .map(o -> (o.getCodAmount() != null ? o.getCodAmount() : BigDecimal.ZERO)
                    .add(o.getDeliveryFee() != null ? o.getDeliveryFee() : BigDecimal.ZERO))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal driverKept = grossCollected.subtract(expectedRemittance).max(BigDecimal.ZERO);

        Transaction remittanceTx = Transaction.builder()
            .wallet(wallet)
            .type(TransactionType.COD_REMIS)
            .amount(totalAmount)
            .description("Remise COD - " + orderIds.size() + " colis")
            .date(LocalDateTime.now())
            .status(TransactionStatus.PENDING)
            .referenceIds(orderIds.stream().map(UUID::toString).collect(Collectors.joining(",")))
            .metadata(Map.of(
                "grossCollected", grossCollected.toPlainString(),
                "driverKept", driverKept.toPlainString()
            ))
            .build();
        transactionRepository.save(remittanceTx);

        // Mark individual collections as REMITTED
        for (Order order : orders) {
            final UUID orderId = order.getId();
            order.setPaymentStatus(PaymentStatus.REMITTED_TO_AGENCY);
            order.setPaymentConfirmedAt(LocalDateTime.now());
            orderRepository.save(order);
            transactionRepository.findByWalletUserIdAndTypeAndStatus(
                userId, TransactionType.COD_COLLECTED, TransactionStatus.PENDING)
                .stream()
                .filter(tx -> orderId.equals(tx.getOrderId()))
                .forEach(tx -> {
                    tx.setStatus(TransactionStatus.REMITTED);
                    transactionRepository.save(tx);
                });
        }

        log.info("COD Remittance declared by user {} for {} orders, amount: {}", userId, orderIds.size(), totalAmount);

        return Map.of(
            "message", "Demande envoyée, en attente de confirmation agence",
            "totalAmount", totalAmount,
            "orderCount", orderIds.size(),
            "status", "PENDING",
            "transactionId", remittanceTx.getId()
        );
    }

    @Override
    public Map<String, Object> getWeeklyCommission(UUID userId) {
        BigDecimal commission = calculateWeeklyCommission(userId);
        long count = transactionRepository.findByWalletUserIdAndTypeAndDateGreaterThan(
                userId, TransactionType.GAIN, LocalDateTime.now().minus(7, ChronoUnit.DAYS)).size();
        
        return Map.of(
                "weeklyCommission", commission,
                "period", "Current week",
                "totalDeliveries", count
        );
    }

    @Override
    public Map<String, Object> getMonthlyEarnings(UUID userId) {
        LocalDateTime monthStart = LocalDateTime.now().minus(30, ChronoUnit.DAYS);

        BigDecimal deliveryEarnings = transactionRepository.findByWalletUserIdAndTypeInAndDateGreaterThan(
                userId, Arrays.asList(TransactionType.GAIN, TransactionType.BONUS), monthStart)
                .stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal bonuses = transactionRepository.findByWalletUserIdAndTypeInAndDateGreaterThan(
                userId, List.of(TransactionType.BONUS), monthStart)
                .stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal total = deliveryEarnings.add(bonuses);

        return Map.of(
                "monthlyEarnings", total,
                "period", "Last 30 days",
                "breakdown", Map.of(
                        "deliveries", deliveryEarnings,
                        "bonuses", bonuses
                )
        );
    }

    @Override
    public BigDecimal getDailyEarnings(UUID userId) {
        LocalDateTime today = LocalDate.now().atStartOfDay();
        BigDecimal fromTransactions = transactionRepository.findByWalletUserIdAndTypeInAndDateGreaterThan(
                userId, Arrays.asList(TransactionType.GAIN, TransactionType.EARNING, TransactionType.BONUS), today)
                .stream()
                .filter(Objects::nonNull)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Fallback to Order totals to ensure sync with Dashboard
        UUID driverId = driverRepository.findByUserId(userId).map(Driver::getId).orElse(null);
        if (driverId != null) {
            try {
                BigDecimal todayOrderEarnings = orderRepository.sumDriverEarningsByDriverIdAndStatusAndDeliveredAtAfter(
                        driverId, OrderStatus.DELIVERED, today);

                // Use the maximum to prevent missing transactions from showing 0
                return fromTransactions.max(todayOrderEarnings != null ? todayOrderEarnings : BigDecimal.ZERO);
            } catch (Exception e) {
                log.warn("[WalletService] Could not fallback to order earnings for driver {}", driverId, e);
            }
        }

        return fromTransactions;
    }

    @Override
    public List<DailyEarningsResponse> getDailyEarningsBreakdown(UUID userId, Integer days) {
        LocalDateTime startDate = LocalDateTime.now().minus(days, ChronoUnit.DAYS);
        List<Transaction> allTransactions = transactionRepository.findByWalletUserIdAndTypeInAndDateGreaterThan(
                userId, Arrays.asList(TransactionType.GAIN, TransactionType.BONUS), startDate);
        
        Map<LocalDate, List<Transaction>> groupedByDate = allTransactions.stream()
                .collect(Collectors.groupingBy(t -> t.getDate().toLocalDate()));
        
        return groupedByDate.entrySet().stream()
                .map(entry -> {
                    LocalDate date = entry.getKey();
                    List<Transaction> txns = entry.getValue();
                    BigDecimal earnings = txns.stream()
                            .map(Transaction::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    int ordersCount = txns.size();
                    return DailyEarningsResponse.builder()
                            .date(date)
                            .earnings(earnings)
                            .ordersCompleted(ordersCount)
                            .averagePayout(ordersCount > 0 ? earnings.divide(BigDecimal.valueOf(ordersCount), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO)
                            .build();
                })
                .sorted(Comparator.comparing(DailyEarningsResponse::getDate).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionResponse> getBonuses(UUID userId) {
        return transactionRepository.findByWalletUserIdAndType(userId, TransactionType.BONUS)
                .stream()
                .map(transactionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getWalletStats(UUID userId) {
        WalletResponse wallet = getWalletByUserId(userId);
        return Map.of(
                "currentBalance", wallet.getBalance(),
                "cashInHand", wallet.getCashInHand(),
                "debtToSystem", wallet.getDebtToSystem(),
                "totalEarned", wallet.getTotalEarned(),
                "pendingCOD", wallet.getPendingCOD(),
                "deductions", wallet.getDeductions(),
                "weeklyCommission", wallet.getWeeklyCommission()
        );
    }

    @Override
    public Map<String, Object> getEarningsSummary(UUID userId) {
        WalletResponse wallet = getWalletByUserId(userId);
        BigDecimal daily = getDailyEarnings(userId);
        
        return Map.of(
            "dailyEarnings", daily != null ? daily : BigDecimal.ZERO,
            "totalBalance", wallet.getBalance(),
            "cashInHand", wallet.getCashInHand(),
            "debtToSystem", wallet.getDebtToSystem(),
            "totalEarned", wallet.getTotalEarned(),
            "weeklyCommission", wallet.getWeeklyCommission()
        );
    }

    @Override
    public String generateCSVStatement(UUID userId) {
        log.info("Generating CSV statement for user {}", userId);
        StringBuilder csv = new StringBuilder("Date,Type,Description,Amount,Status,Order ID\n");

        List<Transaction> transactions = transactionRepository.findByWalletUserId(userId);
        transactions.forEach(tx -> {
            csv.append(sanitizeCsvCell(tx.getDate() != null ? tx.getDate().toString() : "")).append(",")
               .append(sanitizeCsvCell(tx.getType() != null ? tx.getType().toString() : "")).append(",")
               .append(sanitizeCsvCell(tx.getDescription())).append(",")
               .append(tx.getAmount()).append(",")
               .append(sanitizeCsvCell(tx.getStatus() != null ? tx.getStatus().name() : "")).append(",")
               .append(sanitizeCsvCell(tx.getOrderId() != null ? tx.getOrderId().toString() : "")).append("\n");
        });

        return csv.toString();
    }

    // =========================================================================
    // SECTION: CUSTOMER WALLET
    // =========================================================================

    @Override
    public CustomerWalletResponse getCustomerWalletStats(UUID userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultWallet(userId));

        BigDecimal balance = wallet.getBalance();

        BigDecimal totalCodCollected = transactionRepository.sumAmountByWalletUserIdAndTypeAndStatus(
                userId, TransactionType.COD_SETTLED, TransactionStatus.COMPLETED);
        if (totalCodCollected == null) totalCodCollected = BigDecimal.ZERO;

        BigDecimal totalDeliveryFees = transactionRepository.sumAmountByWalletUserIdAndTypeAndStatus(
                userId, TransactionType.DELIVERY_PAYMENT, TransactionStatus.COMPLETED);
        if (totalDeliveryFees == null) totalDeliveryFees = BigDecimal.ZERO;
        totalDeliveryFees = totalDeliveryFees.abs();

        long totalOrders = orderRepository.countByClientId(userId);

        LocalDateTime weekStart = LocalDateTime.now().minusDays(7);
        BigDecimal weeklyCod = transactionRepository.findByWalletUserIdAndTypeAndDateGreaterThan(userId, TransactionType.COD_SETTLED, weekStart)
                .stream()
                .filter(tx -> tx.getStatus() == TransactionStatus.COMPLETED && tx.getAmount() != null)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendingCod = orderRepository.sumActiveCodByClientId(userId);
        if (pendingCod == null) pendingCod = BigDecimal.ZERO;

        return CustomerWalletResponse.builder()
                .id(wallet.getId().toString())
                .balance(balance)
                .availableBalance(balance)
                .totalCOD(totalCodCollected)
                .totalFees(totalDeliveryFees)
                .totalOrders((int) totalOrders)
                .weeklyCOD(weeklyCod)
                .pendingCOD(pendingCod)
                .build();
    }

    @Override
    @Transactional
    public void handleCustomerOrderPayment(Order order) {
        if (order.getClient() == null) return;
        BigDecimal codAmount = order.getCodAmount() != null ? order.getCodAmount() : BigDecimal.ZERO;
        if (codAmount.compareTo(BigDecimal.ZERO) > 0) return;
        UUID clientId = order.getClient().getId();
        Wallet wallet = walletRepository.findByUserIdWithLock(clientId)
                .orElseGet(() -> createDefaultWallet(clientId));

        if (!transactionRepository.findByWalletUserIdAndTypeAndOrderId(
                clientId, TransactionType.DELIVERY_PAYMENT, order.getId()).isEmpty()) {
            return;
        }

        BigDecimal fee = order.getDeliveryFee() != null ? order.getDeliveryFee() : BigDecimal.ZERO;
        if (fee.compareTo(BigDecimal.ZERO) <= 0) return;

        wallet.setBalance(wallet.getBalance().subtract(fee));
        walletRepository.save(wallet);

        platformWalletService.updateBalance(fee);

        Transaction tx = Transaction.builder()
                .wallet(wallet)
                .type(TransactionType.DELIVERY_PAYMENT)
                .amount(fee.negate())
                .description("Delivery fee - " + order.getTrackingNumber())
                .status(TransactionStatus.COMPLETED)
                .orderId(order.getId())
                .date(LocalDateTime.now())
                .build();
        transactionRepository.save(tx);
    }

    @Override
    @Transactional
    public void handleCustomerCodCollected(Order order) {
        // This is called when COD is confirmed by agency to credit customer wallet
        if (order.getClient() == null || order.getCodAmount() == null) return;
        
        processClientSettlement(order);
    }

    // =========================================================================
    // SECTION: ADMIN & AGENCY FINANCE
    // =========================================================================

    @Override
    public Map<String, Object> getFinanceSummary() {
        BigDecimal totalRevenue = transactionRepository.sumAmountByTypeAndStatus(TransactionType.GAIN, TransactionStatus.COMPLETED);
        BigDecimal netLiquidity = walletRepository.sumTotalBalance();
        BigDecimal pendingPayouts = withdrawalRequestRepository.sumAmountByStatus(TransactionStatus.PENDING);
        BigDecimal totalWithdrawals = withdrawalRequestRepository.sumAmountByStatus(TransactionStatus.COMPLETED);
        
        BigDecimal agencyCommissions = agencyWalletRepository.findAll().stream()
                .map(AgencyWallet::getTotalCommissionEarned)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
            "totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO,
            "netLiquidity", netLiquidity != null ? netLiquidity : BigDecimal.ZERO,
            "pendingPayouts", pendingPayouts != null ? pendingPayouts : BigDecimal.ZERO,
            "totalWithdrawals", totalWithdrawals != null ? totalWithdrawals : BigDecimal.ZERO,
            "agencyCommissions", agencyCommissions
        );
    }

    @Override
    public PagedResponse<?> getAllWallets(int page, int size) {
        Page<Wallet> walletPage = walletRepository.findAll(PageRequest.of(page, size, Sort.by("balance").descending()));
        
        List<Map<String, Object>> content = walletPage.getContent().stream()
                .map(w -> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("id", w.getId());
                    entry.put("userId", w.getUser() != null ? w.getUser().getId() : null);
                    entry.put("userEmail", w.getUser() != null ? w.getUser().getEmail() : null);
                    entry.put("userName", w.getUser() != null ? (w.getUser().getFirstName() + " " + w.getUser().getLastName()) : null);
                    entry.put("balance", w.getBalance());
                    entry.put("cashInHand", w.getCashInHand());
                    entry.put("debtToSystem", w.getDebtToSystem());
                    entry.put("walletType", w.getWalletType());
                    entry.put("isFrozen", w.isFrozen());
                    return entry;
                })
                .collect(Collectors.toList());

        return PagedResponse.<Map<String, Object>>builder()
                .content(content)
                .currentPage(page)
                .pageSize(size)
                .totalElements(walletPage.getTotalElements())
                .totalPages(walletPage.getTotalPages())
                .last(walletPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public void approveWithdrawalRequest(UUID adminId, UUID withdrawalId) {
        // FIX PP-03: Return a clear 400 Bad Request instead of a 500 Internal Server Error.
        // Withdrawal approval is fully automated via PayPal. No manual approval is needed.
        throw new BusinessException("Manual withdrawal approval is disabled. Payouts are processed automatically via PayPal. " +
                "Use the admin dashboard to monitor withdrawal status.");
    }

    @Transactional
    public void finalizeSuccessfulWithdrawal(UUID withdrawalId, String paypalItemId) {
        WithdrawalRequest request = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new ResourceNotFoundException("WithdrawalRequest", "id", withdrawalId));

        if (request.getStatus() == TransactionStatus.COMPLETED) return;

        // Persist the paypalItemId received from the webhook
        if (paypalItemId != null && !paypalItemId.isEmpty()) {
            request.setPaypalItemId(paypalItemId);
        }

        // FIX PP-02: Do NOT deduct balance here. The balance was already deducted at request-creation
        // time inside createWithdrawalRequest (Phase 1 transactionTemplate block).
        // Deducting again here would silently steal funds from the driver on every successful payout.
        // We only update the request and transaction statuses.

        request.setStatus(TransactionStatus.COMPLETED);
        request.setCompletedAt(LocalDateTime.now());
        withdrawalRequestRepository.save(request);

        transactionRepository.findByWalletUserIdAndTypeAndStatus(request.getUser().getId(), TransactionType.PAYOUT, TransactionStatus.PROCESSING)
                .stream()
                .filter(tx -> tx.getDescription() != null && tx.getDescription().contains("Automated PayPal Payout"))
                .findFirst()
                .ifPresent(tx -> {
                    tx.setStatus(TransactionStatus.COMPLETED);
                    transactionRepository.save(tx);
                });
    }

    @Transactional
    public void finalizeFailedWithdrawal(UUID withdrawalId, String paypalItemId, String reason) {
        WithdrawalRequest request = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new ResourceNotFoundException("WithdrawalRequest", "id", withdrawalId));

        if (request.getStatus() == TransactionStatus.FAILED) return;

        if (paypalItemId != null && !paypalItemId.isEmpty()) {
            request.setPaypalItemId(paypalItemId);
        }

        request.setStatus(TransactionStatus.FAILED);
        request.setRejectionReason("PayPal Rejected: " + reason);
        withdrawalRequestRepository.save(request);

        transactionRepository.findByWalletUserIdAndTypeAndStatus(request.getUser().getId(), TransactionType.PAYOUT, TransactionStatus.PROCESSING)
                .stream()
                .filter(tx -> tx.getDescription() != null && tx.getDescription().contains("Automated PayPal Payout"))
                .findFirst()
                .ifPresent(tx -> {
                    tx.setStatus(TransactionStatus.FAILED);
                    transactionRepository.save(tx);
                });
    }


    @Override
    @Transactional
    public void rejectWithdrawalRequest(UUID adminId, UUID withdrawalId, String reason) {
        log.info("Admin {} rejecting withdrawal request {} for reason: {}", adminId, withdrawalId, reason);

        WithdrawalRequest request = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new ResourceNotFoundException("WithdrawalRequest", "id", withdrawalId));

        if (request.getStatus() != TransactionStatus.PENDING) {
            throw new BusinessException("Only PENDING requests can be rejected");
        }

        request.setStatus(TransactionStatus.REJECTED);
        request.setRejectionReason(reason);
        request.setCompletedAt(LocalDateTime.now());
        withdrawalRequestRepository.save(request);

        // Refund the balance
        Wallet wallet = walletRepository.findByUserIdWithLock(request.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", request.getUser().getId()));
        wallet.setBalance(wallet.getBalance().add(request.getAmount()));
        walletRepository.save(wallet);

        // Update transaction status
        transactionRepository.findByWalletUserIdAndTypeAndStatus(request.getUser().getId(), TransactionType.PAYOUT, TransactionStatus.PENDING)
                .stream()
                .filter(tx -> tx.getDescription() != null && tx.getDescription().contains("Automated PayPal Payout"))
                .findFirst()
                .ifPresent(tx -> {
                    tx.setStatus(TransactionStatus.REJECTED);
                    tx.setDescription(tx.getDescription() + " (Rejected: " + reason + ")");
                    transactionRepository.save(tx);
                });

        auditLogService.logFinancialAction(adminId, "REJECT_WITHDRAWAL", request.getUser().getId(), request.getAmount(), "Withdrawal rejected: " + reason);

        // Realtime: Notify user of withdrawal rejection
        wsEventService.sendUserNotification(request.getUser().getId(),
            Map.of("type", "WITHDRAWAL_REJECTED", "amount", request.getAmount(), "requestId", withdrawalId,
                   "reason", reason != null ? reason : "", "timestamp", LocalDateTime.now().toString()));
    }

    @Override
    public List<WithdrawalRequestResponse> getAllWithdrawalRequests(String status) {
        List<WithdrawalRequest> requests;
        if (status != null && !status.equalsIgnoreCase("ALL")) {
            requests = withdrawalRequestRepository.findByStatusOrderByCreatedAtDesc(TransactionStatus.valueOf(status.toUpperCase()));
        } else {
            requests = withdrawalRequestRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        return requests.stream().map(this::toWithdrawalResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public Map<String, Object> requestPayout(UUID userId, BigDecimal amount, UUID paymentAccountId) {
        // Delegate to the full automated payout flow.
        WithdrawalRequestResponse result = createWithdrawalRequest(userId, amount, paymentAccountId);
        return Map.of(
            "message", "Payout request submitted successfully",
            "status", result.getStatus(),
            "id", result.getId(),
            "amount", result.getAmount()
        );
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public WithdrawalRequestResponse createWithdrawalRequest(UUID userId, BigDecimal amount, UUID paymentAccountId) {
        // 1. Validate Minimum Amount
        if (amount.compareTo(BigDecimal.valueOf(200)) < 0) {
            throw new BusinessException("Le montant minimum de retrait est de 200 DH.");
        }

        // Phase 1: Database Transaction (Lock wallet, validate, deduct balance, persist)
        WithdrawalRequest wr = transactionTemplate.execute(status -> {
            Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", userId));

            if (wallet.isFrozen()) throw new BusinessException("Wallet is frozen.");
            if (wallet.getWalletType() == WalletType.DRIVER) {
                throw new BusinessException("Drivers do not receive platform payouts. Please settle COD with the agency instead.");
            }

            // FIX PP-05: Prevent concurrent duplicate payout requests.
            // Inside this pessimistic-locked block we can safely check for any in-flight request.
            if (withdrawalRequestRepository.existsByUserIdAndStatusIn(
                    userId, List.of(TransactionStatus.PENDING, TransactionStatus.PROCESSING))) {
                throw new BusinessException("A withdrawal request is already in progress. Please wait for it to complete before submitting another.");
            }

            // Validate available balance directly against committed state

            if (wallet.getBalance().compareTo(amount) < 0) {
                throw new BusinessException("Insufficient available balance (Current: " + wallet.getBalance() + " MAD)");
            }
            
            if (wallet.getWalletType() == WalletType.DRIVER && wallet.getDebtToSystem().compareTo(BigDecimal.ZERO) > 0) {
                throw new BusinessException("You must return COD cash (Debt: " + wallet.getDebtToSystem() + " MAD) before withdrawing.");
            }

            // Validate PayPal Account
            PaymentAccount account;
            if (paymentAccountId != null) {
                account = paymentAccountRepository.findById(paymentAccountId)
                        .orElseThrow(() -> new BusinessException("Provided payment account not found."));
                if (!account.getUser().getId().equals(userId)) {
                    throw new BusinessException("Payment account does not belong to the user.");
                }
            } else {
                account = paymentAccountRepository.findByUserIdAndProviderAndIsDefaultTrue(userId, PaymentProviderEnum.PAYPAL)
                        .orElseGet(() -> paymentAccountRepository.findByUserIdAndProvider(userId, PaymentProviderEnum.PAYPAL)
                                .orElseThrow(() -> new BusinessException("No verified PayPal account found. Please link your PayPal account before withdrawing.")));
            }

            if (account.getProvider() != PaymentProviderEnum.PAYPAL) {
                throw new BusinessException("Only PAYPAL provider is currently supported for automated payouts.");
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "userId", userId));

            // DEDUCT BALANCE IMMEDIATELY
            wallet.setBalance(wallet.getBalance().subtract(amount));
            walletRepository.save(wallet);

            // Create PENDING Transaction (Ledger Entry for Deduction)
            Transaction payout = Transaction.builder()
                    .wallet(wallet)
                    .type(TransactionType.PAYOUT)
                    .description("Automated PayPal Payout")
                    .amount(amount.negate())
                    .date(LocalDateTime.now())
                    .status(TransactionStatus.PENDING)
                    .build();
            transactionRepository.save(payout);

            BigDecimal payoutAmount = exchangeRateService.convertMadToPayoutCurrency(amount);
            String payoutCurrency = exchangeRateService.getPayoutCurrency();

            WithdrawalRequest request = WithdrawalRequest.builder()
                    .user(user)
                    .amount(amount)
                    .payoutAmount(payoutAmount)
                    .payoutCurrency(payoutCurrency)
                    .paymentAccountId(account.getId())
                    .receiverEmailSnapshot(account.getAccountIdentifier())
                    .provider(account.getProvider())
                    .status(TransactionStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build();
            return withdrawalRequestRepository.save(request);
        });

        if (wr == null) {
            throw new BusinessException("Failed to initiate withdrawal transaction.");
        }

        // Phase 2: Outside Database Transaction (Call external PayPal API)
        boolean isSuccess = false;
        String errorMessage = null;
        try {
            PaymentAccount account = paymentAccountRepository.findById(wr.getPaymentAccountId()).orElseThrow();
            // Use wr.getId().toString() as the idempotency sender_batch_id key
            paymentProvider.createPayout(wr.getId(), wr.getId().toString(), wr.getAmount(), wr.getPayoutAmount(), wr.getPayoutCurrency(), account);
            isSuccess = true;
        } catch (Exception e) {
            log.error("Automated PayPal Payout failed synchronously: ", e);
            errorMessage = e.getMessage();
        }

        // Phase 3: Update state based on API result
        final boolean finalIsSuccess = isSuccess;
        final String finalErrorMessage = errorMessage;
        
        WithdrawalRequest finalWr = transactionTemplate.execute(status -> {
            WithdrawalRequest updatedWr = withdrawalRequestRepository.findById(wr.getId()).orElseThrow();
            
            if (finalIsSuccess) {
                updatedWr.setStatus(TransactionStatus.PROCESSING);
                final WithdrawalRequest savedWrSuccess = withdrawalRequestRepository.save(updatedWr);
                
                transactionRepository.findByWalletUserIdAndTypeAndStatus(savedWrSuccess.getUser().getId(), TransactionType.PAYOUT, TransactionStatus.PENDING)
                        .stream()
                        .filter(tx -> tx.getAmount().negate().compareTo(savedWrSuccess.getAmount()) == 0)
                        .findFirst()
                        .ifPresent(tx -> {
                            tx.setStatus(TransactionStatus.PROCESSING);
                            transactionRepository.save(tx);
                        });
            } else {
                updatedWr.setStatus(TransactionStatus.FAILED);
                updatedWr.setRejectionReason("Automated Payout Failed: " + finalErrorMessage);
                final WithdrawalRequest savedWrFailed = withdrawalRequestRepository.save(updatedWr);
                
                // Refund Wallet
                Wallet wallet = walletRepository.findByUserIdWithLock(savedWrFailed.getUser().getId()).orElseThrow();
                wallet.setBalance(wallet.getBalance().add(savedWrFailed.getAmount()));
                walletRepository.save(wallet);
                
                // Insert Refund Ledger Transaction
                Transaction refund = Transaction.builder()
                        .wallet(wallet)
                        .type(TransactionType.REFUND)
                        .description("Refund: Automated Payout Failed")
                        .amount(savedWrFailed.getAmount())
                        .date(LocalDateTime.now())
                        .status(TransactionStatus.COMPLETED)
                        .build();
                transactionRepository.save(refund);
                
                // Update original payout transaction to FAILED
                transactionRepository.findByWalletUserIdAndTypeAndStatus(savedWrFailed.getUser().getId(), TransactionType.PAYOUT, TransactionStatus.PENDING)
                        .stream()
                        .filter(tx -> tx.getAmount().negate().compareTo(savedWrFailed.getAmount()) == 0)
                        .findFirst()
                        .ifPresent(tx -> {
                            tx.setStatus(TransactionStatus.FAILED);
                            tx.setDescription("Automated Payout Failed");
                            transactionRepository.save(tx);
                        });
            }
            return updatedWr;
        });

        return toWithdrawalResponse(finalWr);
    }

    @Override
    public List<WithdrawalRequestResponse> getWithdrawalRequests(UUID userId) {
        return withdrawalRequestRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toWithdrawalResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Map<String, Object> agencyRequestPayout(UUID agencyId, BigDecimal amount, UUID paymentAccountId) {
        // FIX CC-02: Use pessimistic lock to prevent concurrent over-deduction
        AgencyWallet agencyWallet = agencyWalletRepository.findByAgencyIdWithLock(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("AgencyWallet", "agencyId", agencyId));

        if (agencyWallet.getBalance().compareTo(amount) < 0) {
            throw new BusinessException("Insufficient agency balance.");
        }

        PaymentAccount account = paymentAccountRepository.findById(paymentAccountId).orElseThrow();

        AgencyPayoutRequest payoutRequest = AgencyPayoutRequest.builder()
                .agency(agencyWallet.getAgency())
                .amount(amount)
                .status(TransactionStatus.PENDING)
                .paymentAccountId(account.getId())
                .receiverEmailSnapshot(account.getAccountIdentifier())
                .provider(account.getProvider())
                .requestedAt(LocalDateTime.now())
                .build();
        agencyPayoutRequestRepository.save(payoutRequest);

        agencyWallet.setBalance(agencyWallet.getBalance().subtract(amount));
        agencyWalletRepository.save(agencyWallet);

        return Map.of("message", "Agency payout request submitted", "status", "PENDING");
    }

    @Override
    @Transactional
    public void adminApproveAgencyPayout(UUID adminId, UUID payoutRequestId) {
        AgencyPayoutRequest request = agencyPayoutRequestRepository.findById(payoutRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("AgencyPayoutRequest", "id", payoutRequestId));

        if (request.getStatus() != TransactionStatus.PENDING) throw new BusinessException("Payout request is not pending");

        request.setStatus(TransactionStatus.COMPLETED);
        request.setProcessedAt(LocalDateTime.now());
        agencyPayoutRequestRepository.save(request);

        auditLogService.logFinancialAction(adminId, "APPROVE_AGENCY_PAYOUT", request.getAgency().getId(), request.getAmount(), "Agency payout approved");
    }

    @Override
    @Transactional
    public void rejectAgencyPayout(UUID adminId, UUID payoutRequestId, String reason) {
        AgencyPayoutRequest request = agencyPayoutRequestRepository.findById(payoutRequestId).orElseThrow();
        if (request.getStatus() != TransactionStatus.PENDING) throw new BusinessException("Only pending requests can be rejected");

        request.setStatus(TransactionStatus.REJECTED);
        request.setRejectionReason(reason);
        request.setProcessedAt(LocalDateTime.now());
        agencyPayoutRequestRepository.save(request);

        AgencyWallet wallet = agencyWalletRepository.findByAgencyId(request.getAgency().getId()).orElseThrow();
        wallet.setBalance(wallet.getBalance().add(request.getAmount()));
        agencyWalletRepository.save(wallet);

        auditLogService.logFinancialAction(adminId, "REJECT_AGENCY_PAYOUT", request.getAgency().getId(), request.getAmount(), "Agency payout rejected: " + reason);
    }

    @Override
    public List<AgencyPayoutRequest> getAllAgencyPayoutRequests(String status) {
        if (status != null && !status.equalsIgnoreCase("ALL")) {
            return agencyPayoutRequestRepository.findByStatusOrderByRequestedAtDesc(TransactionStatus.valueOf(status.toUpperCase()));
        }
        return agencyPayoutRequestRepository.findAll(Sort.by(Sort.Direction.DESC, "requestedAt"));
    }

    @Override
    public List<AgencyPayoutRequest> getAllAgencyPayoutRequestsByAgency(UUID agencyId) {
        return agencyPayoutRequestRepository.findByAgencyIdOrderByRequestedAtDesc(agencyId);
    }

    @Override
    public AgencyWallet getAgencyWallet(UUID agencyId) {
        return agencyWalletRepository.findByAgencyId(agencyId)
                .orElseGet(() -> {
                    Agency agency = agencyRepository.findById(agencyId)
                            .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", agencyId));
                    AgencyWallet newWallet = AgencyWallet.builder()
                            .agency(agency)
                            .balance(java.math.BigDecimal.ZERO)
                            .totalCollected(java.math.BigDecimal.ZERO)
                            .totalPaidOut(java.math.BigDecimal.ZERO)
                            .build();
                    return agencyWalletRepository.save(newWallet);
                });
    }

    @Override
    public List<TransactionResponse> getAgencyCommissions(UUID agencyId) {
        return transactionRepository.findByAgencyIdAndType(agencyId, TransactionType.COMMISSION)
                .stream().map(transactionMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<TransactionResponse> getAgencyRemittances(UUID agencyId) {
        return transactionRepository.findByAgencyIdAndType(agencyId, TransactionType.COD_REMIS)
                .stream().map(transactionMapper::toResponse).collect(Collectors.toList());
    }

    // =========================================================================
    // SECTION: SYSTEM & OPERATIONS
    // =========================================================================
    @Override
    @Transactional
    public void handleOrderDelivery(Order order, Boolean codCollected) {
        UUID orderId = order.getId();
        log.info("Processing overhaul financial flow for order {} (codCollected: {})", orderId, codCollected);

        Driver driver;
        try {
            if (order.getDriver() == null) return;
            driver = order.getDriver();
            // Force-touch user.id and agency now — both may be lazy proxies from the caller's
            // (now-suspended) session. Accessing them here triggers load in this new session.
            if (driver.getUser() != null) driver.getUser().getId();
        } catch (Exception e) {
            log.warn("[WalletService] Could not access driver for order {}, skipping wallet processing: {}", orderId, e.getMessage());
            return;
        }

        Agency agency;
        try {
            agency = driver.getAgency();
        } catch (Exception e) {
            log.warn("[WalletService] Could not access agency for order {}, proceeding without agency share: {}", orderId, e.getMessage());
            agency = null;
        }

        BigDecimal deliveryFee = order.getDeliveryFee() != null ? order.getDeliveryFee() : BigDecimal.ZERO;
        BigDecimal codAmount = order.getCodAmount() != null ? order.getCodAmount() : BigDecimal.ZERO;
        boolean hasCod = Boolean.TRUE.equals(codCollected);

        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());

        if (driver.getUser() == null) {
            log.warn("[WalletService] Driver has no user for order {}, skipping wallet processing", orderId);
            return;
        }
        Wallet driverWallet = walletRepository.findByUserIdWithLock(driver.getUser().getId())
                .orElseGet(() -> createDefaultWallet(driver.getUser().getId()));

        // Pre-calculate fee split so driver earnings are known before recording COD debt
        BigDecimal adminShare = BigDecimal.ZERO;
        BigDecimal agencyShare = BigDecimal.ZERO;
        BigDecimal driverShare = BigDecimal.ZERO;
        AgencyWallet agencyWallet = null;

        if (deliveryFee.compareTo(BigDecimal.ZERO) > 0) {
            adminShare = deliveryFee.multiply(platformFinanceSettingsService.getPlatformFeeRate())
                    .setScale(2, java.math.RoundingMode.HALF_UP);
            BigDecimal remainingFee = deliveryFee.subtract(adminShare);

            if (agency != null) {
                final UUID agencyId = agency.getId();
                agencyWallet = agencyWalletRepository.findByAgencyId(agencyId)
                        .orElseGet(() -> createDefaultAgencyWallet(agencyId));
            }
            BigDecimal agencyRate = platformFinanceSettingsService.resolveAgencyCommissionRate(agency, agencyWallet);

            agencyShare = remainingFee.multiply(agencyRate).setScale(2, java.math.RoundingMode.HALF_UP);
            driverShare = remainingFee.subtract(agencyShare);
        }

        if (hasCod) {
            // Driver physically collects COD + fee from customer
            BigDecimal totalCashToCollect = codAmount.add(deliveryFee);
            // Driver keeps their earning share in hand and remits the rest.
            BigDecimal amountToRemit = totalCashToCollect.subtract(driverShare).max(BigDecimal.ZERO);

            driverWallet.setCashInHand(driverWallet.getCashInHand().add(totalCashToCollect));
            driverWallet.setDebtToSystem(driverWallet.getDebtToSystem().add(amountToRemit));

            transactionRepository.save(Transaction.builder()
                    .wallet(driverWallet).type(TransactionType.COD_COLLECTED).amount(amountToRemit)
                    .description("Cash Collected To Remit (COD+Fee-DriverShare) - " + order.getTrackingNumber()).status(TransactionStatus.PENDING)
                    .orderId(orderId).date(LocalDateTime.now()).build());

            if (driverShare.compareTo(BigDecimal.ZERO) > 0) {
                transactionRepository.save(Transaction.builder()
                        .wallet(driverWallet)
                        .type(TransactionType.CASH_KEPT_BY_DRIVER)
                        .amount(driverShare)
                        .description("Driver share kept in hand - " + order.getTrackingNumber())
                        .status(TransactionStatus.COMPLETED)
                        .orderId(orderId)
                        .date(LocalDateTime.now())
                        .build());
            }

            order.setCodCollected(true);
            order.setCashCollected(true);
            order.setCashCollectedAt(LocalDateTime.now());
            order.setPaymentStatus(PaymentStatus.COLLECTED_BY_DRIVER);
        }

        // Write actual driver earnings back to the order entity so the response and
        // dashboard queries (sumDriverEarnings…) reflect the real credited amount.
        order.setDriverEarnings(driverShare);

        // FEE DISTRIBUTION
        if (deliveryFee.compareTo(BigDecimal.ZERO) > 0) {
            if (codAmount.compareTo(BigDecimal.ZERO) <= 0) {
                handleCustomerOrderPayment(order);
            }
            
            // FIX WC-04: Idempotency guard — check if a GAIN transaction already exists
            // for this order before crediting the driver. Prevents double credit on retry/replay.
            final UUID driverUserId = driver.getUser().getId();
            boolean gainAlreadyRecorded = !transactionRepository
                    .findByWalletUserIdAndTypeAndOrderId(driverUserId, TransactionType.GAIN, orderId)
                    .isEmpty();

            if (driverShare.compareTo(BigDecimal.ZERO) >= 0 && !gainAlreadyRecorded) {
                driverWallet.setBalance(driverWallet.getBalance().add(driverShare));
                transactionRepository.save(Transaction.builder()
                        .wallet(driverWallet).amount(driverShare).type(TransactionType.GAIN).status(TransactionStatus.COMPLETED)
                        .description("Driver Earnings: " + order.getTrackingNumber()).orderId(orderId).date(LocalDateTime.now()).build());
            } else if (gainAlreadyRecorded) {
                log.warn("WC-04: Skipped duplicate GAIN credit for order {} (driver {}). Already recorded.", orderId, driverUserId);
            }


            
            if (adminShare.compareTo(BigDecimal.ZERO) > 0) {
                platformWalletService.recordProfit(adminShare);
            }
            if (deliveryFee.compareTo(BigDecimal.ZERO) > 0) {
                platformWalletService.recordRevenue(deliveryFee);
            }

            if (agency != null && agencyWallet != null) {
                agencyWallet.setBalance(agencyWallet.getBalance().add(agencyShare));
                agencyWallet.setTotalCommissionEarned(agencyWallet.getTotalCommissionEarned().add(agencyShare));
                agencyWallet.setPendingCommission(agencyWallet.getPendingCommission().add(agencyShare));
                agencyWalletRepository.save(agencyWallet);

                if (agency.getAdminAgency() != null) {
                    final UUID adminId = agency.getAdminAgency().getId();
                    final BigDecimal commissionAmount = agencyShare;
                    walletRepository.findByUserId(adminId).ifPresentOrElse(
                        adminWallet -> transactionRepository.save(Transaction.builder()
                            .wallet(adminWallet)
                            .amount(commissionAmount).type(TransactionType.COMMISSION).status(TransactionStatus.COMPLETED)
                            .description("Agency Commission: " + order.getTrackingNumber()).orderId(orderId).date(LocalDateTime.now()).build()),
                        () -> log.warn("[WalletService] No wallet found for agency admin user {}", adminId)
                    );
                } else {
                    log.warn("[WalletService] Agency {} has no admin user configured, skipping commission transaction recording", agency.getId());
                }
            }
        }

        walletRepository.save(driverWallet);
        
        messagingTemplate.convertAndSend("/topic/wallet/" + driver.getUser().getId(), 
            Map.of("type", "WALLET_UPDATED", "balance", driverWallet.getBalance(), "cashInHand", driverWallet.getCashInHand(), "debt", driverWallet.getDebtToSystem()));
    }

    @Override
    @Transactional
    public void addBonusToDriver(UUID driverId, BigDecimal amount, String reason) {
        Wallet wallet = walletRepository.findByUserIdWithLock(driverId).orElseThrow();
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        transactionRepository.save(Transaction.builder()
                .wallet(wallet).amount(amount).type(TransactionType.BONUS).status(TransactionStatus.COMPLETED)
                .description(reason != null ? reason : "Performance Bonus").date(LocalDateTime.now()).build());

        messagingTemplate.convertAndSend("/topic/wallet/" + driverId, Map.of("type", "BONUS_RECEIVED", "amount", amount, "reason", reason));
    }

    @Override
    @Transactional
    public void applyDeduction(UUID driverId, BigDecimal amount, String reason) {
        Wallet wallet = walletRepository.findByUserIdWithLock(driverId).orElseThrow();
        if (wallet.getBalance().compareTo(amount) < 0) throw new BusinessException("Insufficient balance");

        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);

        transactionRepository.save(Transaction.builder()
                .wallet(wallet).amount(amount.negate()).type(TransactionType.DEDUCTION).status(TransactionStatus.COMPLETED)
                .description(reason != null ? reason : "Penalty").date(LocalDateTime.now()).build());

        messagingTemplate.convertAndSend("/topic/wallet/" + driverId, Map.of("type", "DEDUCTION_APPLIED", "amount", amount, "reason", reason));
    }

    @Override
    @Transactional
    public void freezeAccount(UUID userId) {
        // FIX CC-01: Use pessimistic write lock so concurrent payout threads cannot slip through.
        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", userId));
        wallet.setFrozen(true);
        walletRepository.save(wallet);
        auditLogService.logFinancialAction(null, "FREEZE_ACCOUNT", userId, BigDecimal.ZERO, "Account frozen");
    }

    @Override
    @Transactional
    public void unfreezeAccount(UUID userId) {
        // FIX CC-01: Use pessimistic write lock for symmetry and safety.
        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", userId));
        wallet.setFrozen(false);
        walletRepository.save(wallet);
        auditLogService.logFinancialAction(null, "UNFREEZE_ACCOUNT", userId, BigDecimal.ZERO, "Account unfrozen");
    }

    @Override
    public void addFunds(UUID userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseGet(() -> createDefaultWallet(userId));
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);
        // FIX WC-01: Record ledger entry so balance = SUM(transactions) invariant holds.
        transactionRepository.save(Transaction.builder()
                .wallet(wallet).type(TransactionType.DEPOSIT).amount(amount)
                .description("Manual credit by system").date(LocalDateTime.now())
                .status(TransactionStatus.COMPLETED).build());
    }

    @Override
    public void deductFunds(UUID userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", userId));
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);
        // FIX WC-01: Record ledger entry so balance = SUM(transactions) invariant holds.
        transactionRepository.save(Transaction.builder()
                .wallet(wallet).type(TransactionType.DEDUCTION).amount(amount.negate())
                .description("Manual debit by system").date(LocalDateTime.now())
                .status(TransactionStatus.COMPLETED).build());
    }

    @Override
    public void processTransaction(UUID userId, String type, BigDecimal amount, String description, UUID orderId) {
        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseGet(() -> createDefaultWallet(userId));

        // FIX WC-02: Respect the frozen flag for all balance mutations.
        if (wallet.isFrozen()) {
            throw new BusinessException("Wallet is frozen. Transaction rejected for user " + userId);
        }

        Transaction tx = Transaction.builder()
                .wallet(wallet).type(TransactionType.valueOf(type)).amount(amount)
                .description(description).orderId(orderId).date(LocalDateTime.now()).status(TransactionStatus.COMPLETED).build();
        transactionRepository.save(tx);

        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);
    }

    @Override
    @Transactional
    public Map<String, Object> confirmCODRemittance(UUID agencyId, UUID transactionId) {
        Transaction remittanceTx = transactionRepository.findById(transactionId).orElseThrow();
        if (remittanceTx.getType() != TransactionType.COD_REMIS || remittanceTx.getStatus() != TransactionStatus.PENDING) {
            throw new BusinessException("Invalid or already processed remittance");
        }

        remittanceTx.setStatus(TransactionStatus.COMPLETED);
        transactionRepository.save(remittanceTx);

        Wallet driverWallet = walletRepository.findByUserIdWithLock(remittanceTx.getWallet().getUser().getId())
            .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", remittanceTx.getWallet().getUser().getId()));

        BigDecimal remittedAmount = remittanceTx.getAmount();
        BigDecimal newCashInHand = driverWallet.getCashInHand().subtract(remittedAmount);
        BigDecimal newDebtToSystem = driverWallet.getDebtToSystem().subtract(remittedAmount);

        if (newCashInHand.compareTo(BigDecimal.ZERO) < 0 || newDebtToSystem.compareTo(BigDecimal.ZERO) < 0) {
            log.warn("Remittance {} exceeds driver balances. cashInHand={}, debtToSystem={}, amount={}",
                transactionId, driverWallet.getCashInHand(), driverWallet.getDebtToSystem(), remittedAmount);
        }

        driverWallet.setCashInHand(newCashInHand.max(BigDecimal.ZERO));
        driverWallet.setDebtToSystem(newDebtToSystem.max(BigDecimal.ZERO));
        walletRepository.save(driverWallet);

        if (driverWallet.getUser().getAgency() != null) {
            if (agencyId != null && !driverWallet.getUser().getAgency().getId().equals(agencyId)) {
                throw new BusinessException("Remittance does not belong to your agency's drivers.");
            }
            AgencyWallet agencyWallet = agencyWalletRepository.findByAgencyId(driverWallet.getUser().getAgency().getId())
                    .orElseThrow(() -> new BusinessException("Agency wallet not found"));
            agencyWallet.setBalance(agencyWallet.getBalance().add(remittedAmount));
            agencyWallet.setTotalCollected(agencyWallet.getTotalCollected().add(remittedAmount));
            agencyWalletRepository.save(agencyWallet);
        } else {
            if (agencyId != null) {
                throw new BusinessException("Driver does not belong to any agency.");
            }
            platformWalletService.updateBalance(remittedAmount);
        }

        String referenceIds = remittanceTx.getReferenceIds();
        if (referenceIds != null && !referenceIds.isEmpty()) {
            List<UUID> orderIds = Arrays.stream(referenceIds.split(","))
                    .map(UUID::fromString)
                    .collect(Collectors.toList());
            List<Order> orders = orderRepository.findAllById(orderIds);

            for (Order order : orders) {
                final UUID orderId = order.getId();
                order.setPaymentStatus(PaymentStatus.CONFIRMED_BY_AGENCY);
                order.setCashConfirmed(true);
                order.setCashConfirmedAt(LocalDateTime.now());
                orderRepository.save(order);
                
                // Finalize original driver COD transactions
                transactionRepository.findByWalletUserIdAndTypeAndStatus(remittanceTx.getWallet().getUser().getId(), TransactionType.COD_COLLECTED, TransactionStatus.PENDING)
                    .stream().filter(tx -> orderId.equals(tx.getOrderId())).forEach(tx -> {
                        tx.setStatus(TransactionStatus.COMPLETED);
                        transactionRepository.save(tx);
                    });
                
                // Credit Customer Wallet
                handleCustomerCodCollected(order);
            }
        }

        return Map.of("message", "Remittance confirmed successfully", "status", "COMPLETED");
    }

    @Override
    @Transactional
    public void reconcileDailyBatch() {
        List<Order> pendingSettlements = orderRepository.findByPaymentStatus(PaymentStatus.CONFIRMED_BY_AGENCY);
        for (Order order : pendingSettlements) {
            try {
                processClientSettlement(order);
            } catch (Exception e) {
                log.error("Failed to settle order {}: {}", order.getId(), e.getMessage());
            }
        }
    }

    private void processClientSettlement(Order order) {
        Order lockedOrder = orderRepository.findByIdWithLock(order.getId()).orElseThrow();
        User client = lockedOrder.getClient();
        if (client == null || lockedOrder.getPaymentStatus() == PaymentStatus.SETTLED_TO_CLIENT) return;

        BigDecimal codAmount = lockedOrder.getCodAmount() != null ? lockedOrder.getCodAmount() : BigDecimal.ZERO;
        if (codAmount.compareTo(BigDecimal.ZERO) <= 0) return;
        if (lockedOrder.getPaymentStatus() != PaymentStatus.CONFIRMED_BY_AGENCY) return;

        BigDecimal deliveryFee = lockedOrder.getDeliveryFee() != null ? lockedOrder.getDeliveryFee() : BigDecimal.ZERO;

        BigDecimal netSettled = platformFinanceSettingsService.calculateClientSettlement(codAmount, deliveryFee);

        if (netSettled.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("Order {} settlement skipped: delivery fee ({}) >= COD amount ({}). Advancing status without client credit.",
                lockedOrder.getTrackingNumber(), deliveryFee, codAmount);
            lockedOrder.setPaymentStatus(PaymentStatus.SETTLED_TO_CLIENT);
            lockedOrder.setPaymentConfirmedAt(LocalDateTime.now());
            orderRepository.save(lockedOrder);
            return;
        }

        Wallet clientWallet = walletRepository.findByUserIdWithLock(client.getId())
            .orElseGet(() -> createDefaultWallet(client.getId()));

        clientWallet.setBalance(clientWallet.getBalance().add(netSettled));
        walletRepository.save(clientWallet);

        // Record liability fulfillment in platform wallet
        platformWalletService.updateBalance(netSettled.negate());

        transactionRepository.save(Transaction.builder()
            .wallet(clientWallet).type(TransactionType.COD_SETTLED).amount(netSettled)
                .description("Settlement for order " + lockedOrder.getTrackingNumber() + " using " +
                        platformFinanceSettingsService.getCurrentSettings().getClientSettlementFormula())
            .orderId(lockedOrder.getId()).date(LocalDateTime.now()).status(TransactionStatus.COMPLETED).build());

        lockedOrder.setPaymentStatus(PaymentStatus.SETTLED_TO_CLIENT);
        lockedOrder.setPaymentConfirmedAt(LocalDateTime.now());
        orderRepository.save(lockedOrder);
    }

    @Override
    @Transactional
    public Map<String, Object> remitAllByAgencyScan(UUID driverUserId, UUID agencyId) {
        log.info("Processing scan-based remittance for driver {} to agency {}", driverUserId, agencyId);

        // FIX API-02: Verify agency ownership. A driver can only remit to their own agency.
        Driver driver = driverRepository.findByUserId(driverUserId)
                .orElseThrow(() -> new BusinessException("Driver profile not found"));
        if (driver.getAgency() == null || !driver.getAgency().getId().equals(agencyId)) {
            throw new BusinessException("You can only remit cash to your assigned agency.");
        }

        
        List<Transaction> pendingTxs = transactionRepository.findByWalletUserIdAndTypeAndStatus(
                driverUserId, TransactionType.COD_COLLECTED, TransactionStatus.PENDING);
        
        if (pendingTxs.isEmpty()) {
            return Map.of("message", "No pending COD found", "status", "EMPTY");
        }
        
        BigDecimal totalRemitted = pendingTxs.stream()
                .filter(java.util.Objects::nonNull)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // FIX WC-05: Use pessimistic lock when reading/writing driver wallet to prevent
        // concurrent mutation from another remittance or withdrawal request.
        Wallet driverWallet = walletRepository.findByUserIdWithLock(driverUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", driverUserId));

        // 1. Create a bulk REMIS transaction
        Transaction bulkRemis = Transaction.builder()
                .wallet(driverWallet)
                .type(TransactionType.COD_REMIS)
                .amount(totalRemitted)
                .description("Bulk scan-remittance to Agency ID: " + agencyId)
                .status(TransactionStatus.COMPLETED)
                .date(LocalDateTime.now())
                .build();
        transactionRepository.save(bulkRemis);
        
        // 2. Clear driver debt and cash in hand
        BigDecimal newCashInHand = driverWallet.getCashInHand().subtract(totalRemitted);
        BigDecimal newDebtToSystem = driverWallet.getDebtToSystem().subtract(totalRemitted);
        if (newCashInHand.compareTo(BigDecimal.ZERO) < 0 || newDebtToSystem.compareTo(BigDecimal.ZERO) < 0) {
            log.warn("Scan remittance exceeds driver balances. cashInHand={}, debtToSystem={}, amount={}",
                driverWallet.getCashInHand(), driverWallet.getDebtToSystem(), totalRemitted);
        }
        driverWallet.setCashInHand(newCashInHand.max(BigDecimal.ZERO));
        driverWallet.setDebtToSystem(newDebtToSystem.max(BigDecimal.ZERO));
        walletRepository.save(driverWallet);

        // 3. Credit agency wallet with the collected amount (agency physically receives this cash)
        AgencyWallet agencyWallet = agencyWalletRepository.findByAgencyId(agencyId)
                .orElseGet(() -> createDefaultAgencyWallet(agencyId));
        agencyWallet.setBalance(agencyWallet.getBalance().add(totalRemitted));
        agencyWallet.setTotalCollected(agencyWallet.getTotalCollected().add(totalRemitted));
        agencyWalletRepository.save(agencyWallet);

        // 4. Mark individual COD_COLLECTED transactions as REMITTED (not COMPLETED).
        // Standard flow: PENDING → REMITTED → COMPLETED. Bypassing REMITTED creates inconsistent audit trails.
        for (Transaction tx : pendingTxs) {
            tx.setStatus(TransactionStatus.REMITTED);
            transactionRepository.save(tx);
            
            if (tx.getOrderId() != null) {
                orderRepository.findById(tx.getOrderId()).ifPresent(order -> {
                    order.setPaymentStatus(PaymentStatus.CONFIRMED_BY_AGENCY);
                    order.setCashConfirmed(true);
                    order.setCashConfirmedAt(LocalDateTime.now());
                    orderRepository.save(order);
                    processClientSettlement(order); // Immediate settlement to merchant
                });
            }
        }
        
        log.info("Scan remittance completed: driver={}, agency={}, total={}", driverUserId, agencyId, totalRemitted);
        return Map.of("message", "Remise effectuée avec succès", "total", totalRemitted, "status", "SUCCESS");
    }

    // =========================================================================
    // SECTION: PRIVATE HELPERS
    // =========================================================================

    private AgencyWallet createDefaultAgencyWallet(UUID agencyId) {
        Agency agency = agencyRepository.findById(agencyId).orElseThrow();
        return agencyWalletRepository.save(AgencyWallet.builder()
                .agency(agency).balance(BigDecimal.ZERO).totalCommissionEarned(BigDecimal.ZERO)
                .pendingCommission(BigDecimal.ZERO).commissionRate(platformFinanceSettingsService.getDefaultAgencyCommissionRate())
                .isFrozen(false).build());
    }

    private Wallet createDefaultWallet(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        WalletType type = WalletType.DRIVER;
        if (user.getRole() == Role.CUSTOMER) {
            type = WalletType.CUSTOMER;
        } else if (user.getRole() == Role.AGENCY || user.getRole() == Role.ADMIN) {
            throw new BusinessException("Cannot create standard wallet for " + user.getRole() + " role. They use specialized wallets.");
        }

        try {
            log.info("WC-03: Auto-creating default wallet for user {} (role: {})", userId, user.getRole());
            return walletRepository.save(Wallet.builder()
                    .user(user).balance(BigDecimal.ZERO).isFrozen(false).walletType(type).build());
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // FIX WC-03: Another concurrent request already created the wallet.
            // Fall back to fetching the existing one rather than propagating the constraint violation.
            log.warn("WC-03: Concurrent wallet creation detected for user {}. Falling back to existing wallet.", userId);
            return walletRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", userId));
        }
    }

    private BigDecimal calculateAmountToRemit(Order order) {
        BigDecimal codAmount = order.getCodAmount() != null ? order.getCodAmount() : BigDecimal.ZERO;
        BigDecimal deliveryFee = order.getDeliveryFee() != null ? order.getDeliveryFee() : BigDecimal.ZERO;
        if (deliveryFee.compareTo(BigDecimal.ZERO) <= 0) {
            return codAmount;
        }

        BigDecimal adminShare = deliveryFee.multiply(platformFinanceSettingsService.getPlatformFeeRate())
                .setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal remainingFee = deliveryFee.subtract(adminShare);

        Agency agency = order.getAgency();
        AgencyWallet agencyWallet = null;
        if (agency != null && agency.getId() != null) {
            agencyWallet = agencyWalletRepository.findByAgencyId(agency.getId()).orElse(null);
        }

        BigDecimal agencyRate = platformFinanceSettingsService.resolveAgencyCommissionRate(agency, agencyWallet);
        BigDecimal agencyShare = remainingFee.multiply(agencyRate).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal driverShare = remainingFee.subtract(agencyShare);

        return codAmount.add(deliveryFee).subtract(driverShare).max(BigDecimal.ZERO);
    }

    @Override
    public List<TransactionResponse> getPendingCODRemittances() {
        return transactionRepository.findByTypeAndStatus(
                TransactionType.COD_REMIS, TransactionStatus.PENDING)
                .stream().map(transactionMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse> getAllCODRemittances(String status) {
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            TransactionStatus parsedStatus = TransactionStatus.valueOf(status.toUpperCase());
            return transactionRepository.findByTypeAndStatus(TransactionType.COD_REMIS, parsedStatus)
                    .stream()
                    .map(transactionMapper::toResponse)
                    .collect(Collectors.toList());
        }

        return transactionRepository.findByTypeOrderByDateDesc(TransactionType.COD_REMIS)
                .stream()
                .map(transactionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionResponse> getDriverPendingCODRemittances(UUID userId) {
        // Fix for pending COD: Calculate actual pending remittances
        List<TransactionResponse> remittances = transactionRepository.findByWalletUserIdAndTypeAndStatus(
                userId, TransactionType.COD_REMIS, TransactionStatus.PENDING)
                .stream().map(transactionMapper::toResponse).collect(Collectors.toList());
        return remittances;
    }

    @Override
    @Transactional
    public void rejectCODRemittance(UUID transactionId, String reason) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new BusinessException("Transaction not found"));
        
        if (tx.getStatus() != TransactionStatus.PENDING) {
            throw new BusinessException("Only pending remittances can be rejected");
        }

        tx.setStatus(TransactionStatus.REJECTED);
        tx.setDescription(tx.getDescription() + " - REJETÉ: " + reason);
        transactionRepository.save(tx);

        // Optional: Trigger logic to revert order status or mark as available for selection again if needed
        // Assuming the order status update logic is handled elsewhere or is not required for the COD remittance flow
    }

    @Override
    @Transactional
    public void acceptCODRemittance(UUID transactionId) {
        Transaction remittanceTx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new BusinessException("Transaction not found"));
        
        if (remittanceTx.getStatus() != TransactionStatus.PENDING) {
            throw new BusinessException("Only pending remittances can be accepted");
        }

        // Find agency from the referenced orders
        UUID agencyId = null;
        String referenceIds = remittanceTx.getReferenceIds();
        if (referenceIds != null && !referenceIds.isEmpty()) {
            List<UUID> orderIds = Arrays.stream(referenceIds.split(","))
                    .map(UUID::fromString)
                    .collect(Collectors.toList());
            List<Order> orders = orderRepository.findAllById(orderIds);
            if (!orders.isEmpty() && orders.get(0).getAgency() != null) {
                agencyId = orders.get(0).getAgency().getId();
            }
        }

        // If no agency found from orders, try to get from driver's agency
        if (agencyId == null) {
            UUID driverUserId = remittanceTx.getWallet().getUser().getId();
            Driver driver = driverRepository.findByUserId(driverUserId).orElse(null);
            if (driver != null && driver.getAgency() != null) {
                agencyId = driver.getAgency().getId();
            }
        }

        if (agencyId == null) {
            throw new BusinessException("Cannot determine agency for this remittance");
        }

        // COD_REMIS lifecycle: PENDING (declared by driver) → COMPLETED (accepted by admin)
        // Individual COD_COLLECTED transactions go PENDING → REMITTED → COMPLETED separately.
        remittanceTx.setStatus(TransactionStatus.COMPLETED);
        remittanceTx.setDescription(remittanceTx.getDescription() + " - APPROUVÉ par Admin");
        transactionRepository.save(remittanceTx);

        // Update driver wallet
        Wallet driverWallet = walletRepository.findByUserIdWithLock(remittanceTx.getWallet().getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", remittanceTx.getWallet().getUser().getId()));

        BigDecimal remittedAmount = remittanceTx.getAmount();
        BigDecimal newCashInHand = driverWallet.getCashInHand().subtract(remittedAmount);
        BigDecimal newDebtToSystem = driverWallet.getDebtToSystem().subtract(remittedAmount);

        driverWallet.setCashInHand(newCashInHand.max(BigDecimal.ZERO));
        driverWallet.setDebtToSystem(newDebtToSystem.max(BigDecimal.ZERO));
        walletRepository.save(driverWallet);

        // Process each order: update status, credit customer wallet
        BigDecimal commissionToSettle = BigDecimal.ZERO;
        AgencyWallet agencyWallet = agencyWalletRepository.findByAgencyId(agencyId).orElseThrow();
        if (referenceIds != null && !referenceIds.isEmpty()) {
            List<UUID> orderIds = Arrays.stream(referenceIds.split(","))
                    .map(UUID::fromString)
                    .collect(Collectors.toList());
            List<Order> orders = orderRepository.findAllById(orderIds);

            for (Order order : orders) {
                final UUID orderId = order.getId();
                order.setPaymentStatus(PaymentStatus.CONFIRMED_BY_AGENCY);
                order.setCashConfirmed(true);
                order.setCashConfirmedAt(LocalDateTime.now());
                orderRepository.save(order);

                // Accumulate commission to remove from pendingCommission
                BigDecimal fee = order.getDeliveryFee() != null ? order.getDeliveryFee() : BigDecimal.ZERO;
                if (fee.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal adminCut = fee.multiply(platformFinanceSettingsService.getPlatformFeeRate())
                            .setScale(2, java.math.RoundingMode.HALF_UP);
                    BigDecimal remaining = fee.subtract(adminCut);
                    BigDecimal agencyRate = platformFinanceSettingsService.resolveAgencyCommissionRate(order.getAgency(), agencyWallet);
                    commissionToSettle = commissionToSettle.add(
                        remaining.multiply(agencyRate).setScale(2, java.math.RoundingMode.HALF_UP));
                }

                // Finalize original driver COD transactions (may be PENDING or REMITTED at this point)
                transactionRepository.findByWalletUserIdAndTypeAndOrderId(
                        remittanceTx.getWallet().getUser().getId(), TransactionType.COD_COLLECTED, orderId)
                        .stream()
                        .filter(tx -> tx.getStatus() == TransactionStatus.PENDING || tx.getStatus() == TransactionStatus.REMITTED)
                        .forEach(tx -> {
                            tx.setStatus(TransactionStatus.COMPLETED);
                            transactionRepository.save(tx);
                        });

                // Credit Customer Wallet
                handleCustomerCodCollected(order);
            }
        }

        // Credit agency wallet balance + clear settled pending commission
        // Agency receives the full remitted amount in their balance.
        agencyWallet.setBalance(agencyWallet.getBalance().add(remittedAmount));
        agencyWallet.setTotalCollected(agencyWallet.getTotalCollected().add(remittedAmount));
        agencyWallet.setPendingCommission(agencyWallet.getPendingCommission().subtract(commissionToSettle).max(BigDecimal.ZERO));
        agencyWalletRepository.save(agencyWallet);

        log.info("Admin accepted COD remittance {} - agency={} credited={}", transactionId, agencyId, remittedAmount);
    }

    private String maskBankAccount(String account) {
        if (account == null || account.length() < 4) return "****";
        return account.substring(0, 2) + "****" + account.substring(account.length() - 2);
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than zero");
        }
    }

    private String sanitizeCsvCell(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        if (escaped.startsWith("=") || escaped.startsWith("+") || escaped.startsWith("-") || escaped.startsWith("@")) {
            escaped = "'" + escaped;
        }
        return escaped;
    }

    private LocalDateTime getStartDateForPeriod(String period) {
        LocalDateTime now = LocalDateTime.now();
        if ("week".equalsIgnoreCase(period)) return now.minus(7, ChronoUnit.DAYS);
        if ("month".equalsIgnoreCase(period)) return now.minus(30, ChronoUnit.DAYS);
        return now.minus(365, ChronoUnit.DAYS);
    }

    private BigDecimal calculateWeeklyCommission(UUID userId) {
        BigDecimal weeklyEarnings = transactionRepository.findByWalletUserIdAndTypeInAndDateGreaterThan(
                userId, Arrays.asList(TransactionType.GAIN, TransactionType.EARNING, TransactionType.BONUS), LocalDateTime.now().minus(7, ChronoUnit.DAYS))
                .stream().filter(Objects::nonNull).map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Fallback for weeklyEarnings to Order totals
        UUID driverId = driverRepository.findByUserId(userId).map(Driver::getId).orElse(null);
        if (driverId != null) {
            try {
                BigDecimal weeklyOrderEarnings = orderRepository.sumDriverEarningsByDriverIdAndStatusAndDeliveredAtAfter(
                        driverId, OrderStatus.DELIVERED, LocalDateTime.now().minus(7, ChronoUnit.DAYS));
                weeklyEarnings = weeklyEarnings.max(weeklyOrderEarnings != null ? weeklyOrderEarnings : BigDecimal.ZERO);
            } catch (Exception e) {
                log.warn("[WalletService] Could not fallback to order earnings for driver {}", driverId, e);
            }
        }
        return weeklyEarnings;
    }

    private WithdrawalRequestResponse toWithdrawalResponse(WithdrawalRequest wr) {
        return WithdrawalRequestResponse.builder()
                .id(wr.getId().toString()).amount(wr.getAmount()).paypalEmail(wr.getReceiverEmailSnapshot())
                .provider(wr.getProvider().name()).status(wr.getStatus().name())
                .createdAt(wr.getCreatedAt()).completedAt(wr.getCompletedAt())
                .rejectionReason(wr.getRejectionReason()).build();
    }

    // =========================================================================
    // SECTION: DEV-ONLY — Test Utilities
    // Never invoked from any production code path.
    // =========================================================================

    /**
     * Credits a user's wallet with {@code amount} for local testing.
     * <p>
     * Implementation follows the same locking and mutation contract used by the
     * production withdrawal flow:
     * <ol>
     *   <li>Resolve the user (throws {@link ResourceNotFoundException} if absent).</li>
     *   <li>Acquire a pessimistic write lock via {@link WalletRepository#findByUserIdWithLock}.</li>
     *   <li>Auto-create the wallet via {@link #createDefaultWallet} if it does not exist.</li>
     *   <li>Guard against frozen wallets.</li>
     *   <li>Credit {@code Wallet.balance} and persist the wallet.</li>
     *   <li>Persist a {@code DEPOSIT / COMPLETED} transaction in the ledger.</li>
     *   <li>Return a {@link com.deliveryplatform.dto.response.WalletCreditResult} DTO.</li>
     * </ol>
     * All six steps execute inside the ambient {@link Transactional} boundary inherited
     * from the class-level annotation, so they commit or roll back atomically.
     */
    @Override
    @Transactional
    public com.deliveryplatform.dto.response.WalletCreditResult creditWalletForTesting(
            UUID userId, BigDecimal amount, String reason) {

        // ── 1. Resolve user ──────────────────────────────────────────────────
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // ── 2. Lock wallet (pessimistic write) / auto-create ─────────────────
        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseGet(() -> createDefaultWallet(userId));

        // ── 3. Guard: frozen wallets cannot receive test funds ────────────────
        if (wallet.isFrozen()) {
            throw new BusinessException(
                    "Wallet for user " + user.getEmail() + " is frozen. Unfreeze it before adding test funds.");
        }

        BigDecimal previousBalance = wallet.getBalance();

        // ── 4. Credit balance ─────────────────────────────────────────────────
        wallet.setBalance(previousBalance.add(amount));
        walletRepository.save(wallet);

        // ── 5. Persist DEPOSIT ledger entry ───────────────────────────────────
        String description = "[DEV] Wallet credit for testing"
                + (reason != null && !reason.isBlank() ? " — " + reason : "");

        Transaction depositTx = Transaction.builder()
                .wallet(wallet)
                .type(TransactionType.DEPOSIT)
                .amount(amount)
                .description(description)
                .status(TransactionStatus.COMPLETED)
                .date(LocalDateTime.now())
                .build();
        transactionRepository.save(depositTx);

        log.info("[DEV] creditWalletForTesting: credited {} to wallet {} of user {} ({}). "
                        + "Balance {} -> {}",
                amount, wallet.getId(), user.getEmail(), user.getRole(),
                previousBalance, wallet.getBalance());

        // ── 6. Build and return result DTO ────────────────────────────────────
        return com.deliveryplatform.dto.response.WalletCreditResult.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .walletId(wallet.getId())
                .walletType(wallet.getWalletType().name())
                .previousBalance(previousBalance)
                .creditedAmount(amount)
                .newBalance(wallet.getBalance())
                .transactionId(depositTx.getId())
                .timestamp(depositTx.getDate())
                .build();
    }
}

