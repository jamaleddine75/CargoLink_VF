package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.domain.entity.AgencyWallet;
import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.OrderStatus;
import com.deliveryplatform.domain.entity.Driver;
import com.deliveryplatform.domain.entity.Transaction;
import com.deliveryplatform.domain.entity.TransactionType;
import com.deliveryplatform.domain.entity.TransactionStatus;
import com.deliveryplatform.domain.entity.Wallet;
import com.deliveryplatform.domain.entity.PaymentStatus;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.domain.entity.AgencyPayoutRequest;
import com.deliveryplatform.dto.response.AgencyResponse;
import com.deliveryplatform.dto.response.AgencyMetricsResponse;
import com.deliveryplatform.dto.response.DriverResponse;
import com.deliveryplatform.dto.response.OrderResponse;
import com.deliveryplatform.dto.response.PagedResponse;
import com.deliveryplatform.dto.response.DriverDisciplinaryHistoryResponse;
import com.deliveryplatform.domain.entity.DisciplinaryStatus;
import com.deliveryplatform.domain.entity.DriverDisciplinaryAction;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.exception.BusinessException;
import com.deliveryplatform.mapper.AgencyMapper;
import com.deliveryplatform.mapper.DriverMapper;
import com.deliveryplatform.mapper.OrderMapper;
import com.deliveryplatform.repository.AgencyRepository;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.repository.DriverRepository;
import com.deliveryplatform.repository.UserRepository;
import com.deliveryplatform.repository.TransactionRepository;
import com.deliveryplatform.repository.AgencyWalletRepository;
import com.deliveryplatform.repository.WalletRepository;
import com.deliveryplatform.repository.AgencyPayoutRequestRepository;
import com.deliveryplatform.service.AgencyService;
import com.deliveryplatform.service.validation.CashWorkflowValidator;
import com.deliveryplatform.domain.entity.PaymentAccount;
import com.deliveryplatform.domain.entity.PaymentProviderEnum;
import com.deliveryplatform.repository.PaymentAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AgencyServiceImpl implements AgencyService {

    private final AgencyRepository agencyRepository;
    private final OrderRepository orderRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final AgencyWalletRepository agencyWalletRepository;
    private final WalletRepository walletRepository;
    private final AgencyPayoutRequestRepository payoutRequestRepository;
    private final AgencyMapper agencyMapper;
    private final DriverMapper driverMapper;
    private final OrderMapper orderMapper;
    private final com.deliveryplatform.service.TrackingService trackingService;
    private final CashWorkflowValidator cashWorkflowValidator;
    private final com.deliveryplatform.service.AuditLogService auditLogService;
    private final com.deliveryplatform.service.PlatformWalletService platformWalletService;
    private final com.deliveryplatform.repository.DriverDisciplinaryActionRepository disciplinaryActionRepository;
    private final com.deliveryplatform.service.WebSocketEventService wsEventService;
    private final PaymentAccountRepository paymentAccountRepository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public List<AgencyResponse> getAllAgencies() {
        return agencyRepository.findAll().stream()
                .map(agencyMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AgencyResponse getAgencyById(UUID id, UUID userId, String role) {
        verifyAgencyAccess(id, userId, role);
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", id));
        return agencyMapper.toResponse(agency);
    }

    private void verifyAgencyAccess(UUID agencyId, UUID userId, String role) {
        if ("ROLE_ADMIN".equals(role)) return;
        
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", agencyId));
        
        if (agency.getAdminAgency() == null || !agency.getAdminAgency().getId().equals(userId)) {
            log.warn("Security violation: User {} (role {}) attempted to access Agency {}", userId, role, agencyId);
            throw new BusinessException("Unauthorized: You do not own this agency.", HttpStatus.FORBIDDEN);
        }
    }

    @Override
    @Transactional
    public void hideAgency(UUID id) {
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", id));
        agency.setDeleted(true);
        agencyRepository.save(agency);
        log.info("Agency {} soft deleted (hidden)", id);
    }

    @Override
    @Transactional(readOnly = true)
    public AgencyMetricsResponse getAgencyMetrics(UUID id, UUID userId, String role) {
        verifyAgencyAccess(id, userId, role);
        // Stats
        long total = orderRepository.countByAgencyId(id);
        long pending = orderRepository.countByAgencyIdAndStatusIn(id, 
                     List.of(OrderStatus.PENDING, OrderStatus.ASSIGNED));
        long ongoing = orderRepository.countByAgencyIdAndStatusIn(id, 
                     List.of(OrderStatus.PICKUP_READY, OrderStatus.ON_THE_WAY));
        long drivers = driverRepository.countByAgencyId(id); // FIX BB-04: scoped to this agency only
        
        long issues = orderRepository.countByAgencyIdAndStatus(id, OrderStatus.FAILED);

        // Weekly Activity
        List<Map<String, Object>> evolution = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime start = now.minusDays(i).toLocalDate().atStartOfDay();
            LocalDateTime end = start.plusDays(1).minusSeconds(1);
            long count = orderRepository.countByAgencyIdAndCreatedAtBetween(id, start, end); 
            evolution.add(Map.of("date", start.getDayOfWeek().name().substring(0, 3), "count", (int)count));
        }

        // Fetch agency wallet balance and real pending COD
        java.math.BigDecimal walletBalance = java.math.BigDecimal.ZERO;
        java.math.BigDecimal pendingCOD = orderRepository.sumPendingCodByAgencyId(id);
        try {
            AgencyWallet agencyWallet = 
                agencyWalletRepository.findByAgencyId(id).orElse(null);
            if (agencyWallet != null) {
                walletBalance = agencyWallet.getBalance();
            }
        } catch (Exception e) {
            log.warn("Could not fetch agency wallet for metrics: {}", e.getMessage());
        }

        return AgencyMetricsResponse.builder()
                .totalOrders(total)
                .pendingPickups(pending)
                .ongoingDeliveries(ongoing)
                .activeDrivers(drivers)
                .issuesCount(issues)
                .weeklyOrders(evolution)
                .driversStatus(buildDriverStatusBreakdown(id))
                .walletBalance(walletBalance)
                .pendingCOD(pendingCOD)
                .build();
    }

    /**
     * FIX BB-06: Replaced hardcoded fake driver status with real queries.
     * Groups this agency's drivers by their current availability/activity state.
     */
    private List<Map<String, Object>> buildDriverStatusBreakdown(UUID agencyId) {
        List<com.deliveryplatform.domain.entity.Driver> agencyDrivers =
                driverRepository.findByAgencyId(agencyId);

        long online = agencyDrivers.stream()
                .filter(d -> d.getUser() != null && d.getUser().isActive()
                        && !orderRepository.existsByDriverIdAndStatusIn(
                                d.getId(),
                                List.of(OrderStatus.PICKUP_READY, OrderStatus.ON_THE_WAY, OrderStatus.ASSIGNED)))
                .count();

        long busy = agencyDrivers.stream()
                .filter(d -> d.getUser() != null && d.getUser().isActive()
                        && orderRepository.existsByDriverIdAndStatusIn(
                                d.getId(),
                                List.of(OrderStatus.PICKUP_READY, OrderStatus.ON_THE_WAY, OrderStatus.ASSIGNED)))
                .count();

        long offline = agencyDrivers.stream()
                .filter(d -> d.getUser() == null || !d.getUser().isActive())
                .count();

        return List.of(
                Map.of("name", "Online",  "value", (int) online, "color", "#10b981"),
                Map.of("name", "Busy",    "value", (int) busy,   "color", "#f59e0b"),
                Map.of("name", "Offline", "value", (int) offline, "color", "#ef4444")
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverResponse> getAgencyDrivers(UUID id, UUID userId, String role) {
        verifyAgencyAccess(id, userId, role);
        return driverRepository.findByAgencyId(id).stream()
                .map(driverMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<OrderResponse> getAgencyOrders(UUID id, String status, Integer page, Integer size, UUID userId, String role) {
        verifyAgencyAccess(id, userId, role);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Order> orderPage;

        if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)) {
            List<OrderStatus> statuses = java.util.Arrays.stream(status.split(","))
                    .map(String::trim)
                    .map(s -> {
                        try {
                            return OrderStatus.valueOf(s.toUpperCase());
                        } catch (Exception e) {
                            return null;
                        }
                    })
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());
            
            if (!statuses.isEmpty()) {
                orderPage = orderRepository.findByAgencyIdOrDriverAgencyIdAndStatusIn(id, statuses, pageable);
            } else {
                orderPage = orderRepository.findByAgencyIdOrDriverAgencyId(id, pageable);
            }
        } else {
            orderPage = orderRepository.findByAgencyIdOrDriverAgencyId(id, pageable);
        }

        List<OrderResponse> content = orderPage.getContent().stream()
                .map(orderMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<OrderResponse>builder()
                .content(content)
                .currentPage(page)
                .pageSize(size)
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<OrderResponse> getOrdersByCity(UUID agencyId, String city, String type, String status, Integer page, Integer size, UUID userId, String role) {
        verifyAgencyAccess(agencyId, userId, role);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        // Build specification for city and type filtering
        Page<Order> orderPage = orderRepository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Filter by agency
            var agencyPredicate = cb.or(
                cb.equal(root.get("agency").get("id"), agencyId),
                cb.equal(root.get("driver").get("agency").get("id"), agencyId)
            );
            predicates.add(agencyPredicate);
            
            // Filter by city and type
            if (city != null && !city.isBlank()) {
                if ("pickup".equalsIgnoreCase(type)) {
                    // For pickup orders, filter by senderCity
                    predicates.add(cb.equal(cb.lower(root.get("senderCity")), city.toLowerCase()));
                } else if ("delivery".equalsIgnoreCase(type)) {
                    // For delivery orders, filter by receiverCity
                    predicates.add(cb.equal(cb.lower(root.get("receiverCity")), city.toLowerCase()));
                } else {
                    // For all types, accept either city
                    var cityPredicate = cb.or(
                        cb.equal(cb.lower(root.get("senderCity")), city.toLowerCase()),
                        cb.equal(cb.lower(root.get("receiverCity")), city.toLowerCase())
                    );
                    predicates.add(cityPredicate);
                }
            }
            
            // Filter by status if provided
            if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)) {
                var statuses = java.util.Arrays.stream(status.split(","))
                        .map(String::trim)
                        .map(s -> {
                            try {
                                return OrderStatus.valueOf(s.toUpperCase());
                            } catch (Exception e) {
                                return null;
                            }
                        })
                        .filter(java.util.Objects::nonNull)
                        .collect(java.util.stream.Collectors.toList());
                
                if (!statuses.isEmpty()) {
                    predicates.add(root.get("status").in(statuses));
                }
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        }, pageable);
        
        List<OrderResponse> content = orderPage.getContent().stream()
                .map(orderMapper::toResponse)
                .collect(java.util.stream.Collectors.toList());

        return PagedResponse.<OrderResponse>builder()
                .content(content)
                .currentPage(page)
                .pageSize(size)
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID orderId, UUID agencyId, UUID userId, String role) {
        verifyAgencyAccess(agencyId, userId, role);
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        
        // Check if order belongs to this agency
        // An order is accessible if:
        // 1. The order has this agency_id OR
        // 2. The order's driver belongs to this agency
        boolean belongsToAgency = (order.getAgency() != null && order.getAgency().getId().equals(agencyId)) ||
                                 (order.getDriver() != null && 
                                  order.getDriver().getAgency() != null && 
                                  order.getDriver().getAgency().getId().equals(agencyId));
        
        if (!belongsToAgency) {
            log.warn("Unauthorized access attempt to order {} by agency {} and user {}", orderId, agencyId, userId);
            throw new BusinessException("You do not have permission to access this order", HttpStatus.FORBIDDEN);
        }
        
        OrderResponse resp = orderMapper.toResponse(order);

        try {
            java.util.List<com.deliveryplatform.domain.entity.TrackingHistory> history = trackingService.getOrderHistory(orderId);
            if (history != null && !history.isEmpty()) {
                java.util.List<com.deliveryplatform.dto.response.TrackingHistoryResponse> list = new java.util.ArrayList<>();
                for (com.deliveryplatform.domain.entity.TrackingHistory h : history) {
                    list.add(com.deliveryplatform.dto.response.TrackingHistoryResponse.builder()
                        .id(h.getId())
                        .status(h.getStatus())
                        .latitude(h.getLatitude())
                        .longitude(h.getLongitude())
                        .photoUrl(h.getPhotoUrl())
                        .scanValue(h.getScanValue())
                        .comment(h.getComment())
                        .timestamp(h.getTimestamp())
                        .build());
                }
                resp.setTrackingHistory(list);
            }
        } catch (Exception ex) {
            log.warn("Failed to load tracking history for order {}: {}", orderId, ex.getMessage());
        }

        return resp;
    }

    @Override
    public Map<String, Object> confirmCODRemittance(UUID transactionId, UUID agencyId, UUID userId, String role) {
        verifyAgencyAccess(agencyId, userId, role);
        com.deliveryplatform.domain.entity.Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

        if (!tx.getType().equals(TransactionType.COD_REMIS)) {
            throw new BusinessException("Transaction is not a COD remittance");
        }
        if (tx.getStatus() != TransactionStatus.PENDING) {
            throw new BusinessException("Transaction is not pending");
        }

        Wallet driverWallet = tx.getWallet();
        Driver driver = driverRepository.findByUserId(driverWallet.getUser().getId())
                .orElseThrow(() -> new BusinessException("Driver not found for this wallet"));
        
        // Security check: Verify driver belongs to this agency
        if (driver.getAgency() == null || !driver.getAgency().getId().equals(agencyId)) {
            throw new BusinessException("Ce chauffeur n'appartient pas à votre agence", HttpStatus.FORBIDDEN);
        }
        // Workflow Fix: Mark linked COD_COLLECTED transactions as COMPLETED
        if (tx.getReferenceIds() != null && !tx.getReferenceIds().isEmpty()) {
            String[] orderIds = tx.getReferenceIds().split(",");
            for (String orderIdStr : orderIds) {
                java.util.UUID orderId = java.util.UUID.fromString(orderIdStr.trim());
                transactionRepository.findByWalletUserIdAndTypeAndOrderId(
                    driverWallet.getUser().getId(), 
                    TransactionType.COD_COLLECTED, 
                    orderId
                ).stream()
                .filter(codTx -> codTx.getStatus() == TransactionStatus.REMITTED || codTx.getStatus() == TransactionStatus.PENDING)
                .forEach(codTx -> {
                    codTx.setStatus(TransactionStatus.COMPLETED);
                    transactionRepository.save(codTx);
                });

                // FIX BUG-W04: Update the actual Order status so it can be settled to client
                orderRepository.findById(orderId).ifPresent(order -> {
                    order.setPaymentStatus(PaymentStatus.CONFIRMED_BY_AGENCY);
                    order.setPaymentConfirmedAt(LocalDateTime.now());
                    orderRepository.save(order);
                });
            }
        }

        tx.setStatus(TransactionStatus.COMPLETED);
        transactionRepository.save(tx);

        AgencyWallet agencyWallet = agencyWalletRepository.findByAgencyId(agencyId)
                .orElseGet(() -> {
                    Agency agency = agencyRepository.findById(agencyId).orElseThrow();
                    AgencyWallet newWallet = AgencyWallet.builder()
                            .agency(agency)
                            .balance(java.math.BigDecimal.ZERO)
                            .totalCollected(java.math.BigDecimal.ZERO)
                            .totalPaidOut(java.math.BigDecimal.ZERO)
                            .build();
                    return agencyWalletRepository.save(newWallet);
                });

        // 3. Move cash to SUPER ADMIN
        platformWalletService.updateBalance(tx.getAmount());
        
        agencyWallet.setTotalCollected(agencyWallet.getTotalCollected().add(tx.getAmount()));
        agencyWalletRepository.save(agencyWallet);

        log.info("COD remittance {} confirmed by agency {}. Driver wallet debited by {}, Agency wallet credited by {}",
                transactionId, agencyId, tx.getAmount(), tx.getAmount());
        
        auditLogService.logFinancialAction(userId, "COD_REMITTANCE_CONFIRMED", tx.getWallet().getUser().getId(), tx.getAmount(), "Transaction ID: " + transactionId);

        return Map.of(
                "message", "COD Remittance confirmed successfully",
                "transactionId", transactionId,
                "amount", tx.getAmount()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<?> getPendingRemittances(UUID agencyId, UUID userId, String role) {
        verifyAgencyAccess(agencyId, userId, role);
        List<Driver> drivers = driverRepository.findByAgencyId(agencyId);
        
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Driver driver : drivers) {
            UUID driverUserId = driver.getUser().getId();
            List<Transaction> txs = transactionRepository.findByWalletUserIdAndTypeAndStatus(
                    driverUserId,
                    TransactionType.COD_REMIS,
                    TransactionStatus.PENDING
            );
            
            for (Transaction tx : txs) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", tx.getId().toString());
                map.put("description", tx.getDescription() != null ? tx.getDescription() : "Remise COD");
                map.put("amount", tx.getAmount());
                map.put("date", tx.getDate() != null ? tx.getDate().toString() : "");
                map.put("status", tx.getStatus().name());
                map.put("referenceIds", tx.getReferenceIds() != null ? tx.getReferenceIds() : "");
                map.put("driverId", driver.getId().toString());
                map.put("driverName", driver.getUser().getFirstName() + " " + driver.getUser().getLastName());
                map.put("driverPhone", driver.getUser().getPhoneNumber() != null ? driver.getUser().getPhoneNumber() : "");
                result.add(map);
            }
        }
        
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAgencyWalletBalance(UUID agencyId, UUID userId, String role) {
        verifyAgencyAccess(agencyId, userId, role);
        AgencyWallet wallet = agencyWalletRepository.findByAgencyId(agencyId)
                .orElse(null);
        if (wallet == null) {
            return Map.of("balance", java.math.BigDecimal.ZERO, "totalCollected", java.math.BigDecimal.ZERO, "totalPaidOut", java.math.BigDecimal.ZERO, "pendingCommission", java.math.BigDecimal.ZERO);
        }
        return Map.of(
            "id", wallet.getId().toString(),
            "balance", wallet.getBalance(),
            "totalCommissionEarned", wallet.getTotalCommissionEarned(),
            "pendingCommission", wallet.getPendingCommission(),
            "commissionRate", wallet.getCommissionRate().multiply(java.math.BigDecimal.valueOf(100)),
            "totalCollected", wallet.getTotalCollected(),
            "totalPaidOut", wallet.getTotalPaidOut(),
            "isFrozen", wallet.isFrozen(),
            "updatedAt", wallet.getUpdatedAt() != null ? wallet.getUpdatedAt().toString() : LocalDateTime.now().toString()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<?> getCommissions(UUID agencyId, UUID userId, String role) {
        verifyAgencyAccess(agencyId, userId, role);
        return transactionRepository.findByAgencyIdAndType(agencyId, 
                TransactionType.COMMISSION)
                .stream()
                .map(tx -> Map.of(
                    "id", tx.getId().toString(),
                    "amount", tx.getAmount(),
                    "date", tx.getDate() != null ? tx.getDate().toString() : "",
                    "description", tx.getDescription() != null ? tx.getDescription() : "Commission Livraison",
                    "status", tx.getStatus()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<?> getPayouts(UUID agencyId, UUID userId, String role) {
        verifyAgencyAccess(agencyId, userId, role);
        return transactionRepository.findByAgencyIdAndType(agencyId, 
                TransactionType.WITHDRAWAL)
                .stream()
                .map(tx -> Map.of(
                    "id", tx.getId().toString(),
                    "amount", tx.getAmount(),
                    "date", tx.getDate() != null ? tx.getDate().toString() : "",
                    "description", tx.getDescription() != null ? tx.getDescription() : "Versement Agence",
                    "status", tx.getStatus(),
                    "bankAccount", tx.getMetadata() != null ? tx.getMetadata().get("bankAccount") : ""
                ))
                .collect(Collectors.toList());
    }

    @Override
    public void validateDelivery(java.util.UUID orderId, UUID agencyId, UUID userId, String role) {
        verifyAgencyAccess(agencyId, userId, role);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getAgency() == null || !order.getAgency().getId().equals(agencyId)) {
            throw new BusinessException("Order does not belong to this agency", HttpStatus.FORBIDDEN);
        }

        // According to requirements: status = DELIVERED, validated=true, validatedAt=now
        order.setStatus(OrderStatus.DELIVERED);
        order.setValidated(true);
        order.setValidatedAt(LocalDateTime.now());
        
        Order saved = orderRepository.save(order);
        log.info("Delivery for order {} validated by agency {}", orderId, agencyId);

        // Realtime: Broadcast delivery validation to order watchers and admin
        wsEventService.broadcastOrderUpdate(orderId, orderMapper.toResponse(saved));
    }

    @Override
    @Transactional
    public java.util.Map<String, Object> confirmCashPayment(java.util.UUID orderId, UUID userId, String role) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // 1. Determine Agency Context
        Agency agency;
        if ("ROLE_ADMIN".equals(role)) {
            agency = order.getAgency();
            if (agency == null) throw new BusinessException("Order is not associated with any agency.");
        } else {
            agency = agencyRepository.findByAdminAgencyId(userId)
                    .orElseThrow(() -> new BusinessException("Agency profile not found for this user."));
        }

        // 2. Validation: Ownership
        if (order.getAgency() == null || !order.getAgency().getId().equals(agency.getId())) {
            throw new BusinessException("Unauthorized access to this order", HttpStatus.FORBIDDEN);
        }

        // 3. Validation: Use reusable validation method
        cashWorkflowValidator.validateForConfirmation(order);

        // 5. Business Logic: Update status
        User admin = userRepository.findById(userId).orElse(null);
        LocalDateTime now = LocalDateTime.now();
        
        order.setCashConfirmed(true);
        order.setCashConfirmedAt(now);
        order.setPaymentStatus(PaymentStatus.CONFIRMED_BY_AGENCY);
        order.setPaymentConfirmedAt(now);
        order.setPaymentConfirmedBy(admin);

        // 6. Wallet Logic
        if (order.getDriver() != null && order.getCodAmount() != null && order.getCodAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            Wallet driverWallet = walletRepository.findByUserId(order.getDriver().getUser().getId()).orElse(null);
            if (driverWallet != null) {
                List<Transaction> collectedTxs = transactionRepository.findByWalletUserIdAndTypeAndStatusAndOrderId(
                        driverWallet.getUser().getId(),
                        TransactionType.COD_COLLECTED,
                        TransactionStatus.PENDING,
                        orderId
                );
                log.debug("Found {} COD_COLLECTED transactions for order {}", collectedTxs.size(), orderId);
                collectedTxs.forEach(tx -> {
                    tx.setStatus(TransactionStatus.COMPLETED);
                    transactionRepository.save(tx);
                });

                List<Transaction> remisTxs = transactionRepository.findByWalletUserIdAndTypeAndStatusAndOrderId(
                        driverWallet.getUser().getId(),
                        TransactionType.COD_REMIS,
                        TransactionStatus.PENDING,
                        orderId
                );
                log.debug("Found {} COD_REMIS transactions for order {}", remisTxs.size(), orderId);
                remisTxs.forEach(tx -> {
                    tx.setStatus(TransactionStatus.COMPLETED);
                    transactionRepository.save(tx);
                });
            }
        }

        AgencyWallet agencyWallet = agencyWalletRepository.findByAgencyId(agency.getId())
                .orElseGet(() -> {
                    AgencyWallet newWallet = AgencyWallet.builder()
                            .agency(agency)
                            .balance(java.math.BigDecimal.ZERO)
                            .totalCollected(java.math.BigDecimal.ZERO)
                            .totalPaidOut(java.math.BigDecimal.ZERO)
                            .build();
                    return agencyWalletRepository.save(newWallet);
                });

        if (order.getCodAmount() != null && order.getCodAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            agencyWallet.setBalance(agencyWallet.getBalance().add(order.getCodAmount()));
            agencyWallet.setTotalCollected(agencyWallet.getTotalCollected().add(order.getCodAmount()));
            agencyWalletRepository.save(agencyWallet);
            
            eventPublisher.publishEvent(new com.deliveryplatform.event.finance.FinancialMutationEvent(
                this,
                java.util.UUID.randomUUID().toString(),
                order.getId(),
                com.deliveryplatform.event.finance.FinancialMutationEvent.EntityType.AGENCY,
                agency.getId(),
                order.getCodAmount(),
                "MAD",
                com.deliveryplatform.domain.entity.TransactionType.COD_COLLECTED,
                null,
                "Agency received COD from Driver for order " + order.getTrackingNumber(),
                java.util.Map.of("orderId", order.getId())
            ));
        }

        // 7. Work Permission Extension
        if (order.getDriver() != null) {
            Driver driver = order.getDriver();
            LocalDateTime tomorrowEnd = now.plusDays(1).withHour(23).withMinute(59).withSecond(59).withNano(0);
            driver.setWorkPermissionUntil(tomorrowEnd);
            driverRepository.save(driver);
            log.info("Driver {} work permission extended until {} after payment confirmation for order {}", 
                    driver.getId(), tomorrowEnd, orderId);
        }

        orderRepository.save(order);
        
        log.info("Cash payment for order {} confirmed by agency admin {} of agency {}", 
                orderId, userId, agency.getId());
        
        auditLogService.logOrderAction(userId, orderId, "CASH_PAYMENT_CONFIRMED", "Amount: " + order.getCodAmount());

        // Realtime: Broadcast payment confirmation to order watchers and admin
        wsEventService.broadcastOrderUpdate(orderId, orderMapper.toResponse(order));

        return java.util.Map.of(
            "message", "Payment confirmed successfully",
            "orderId", orderId,
            "status", "SUCCESS"
        );
    }

    @Override
    public void requestPayout(UUID agencyId, java.math.BigDecimal amount, UUID paymentAccountId, UUID userId, String role) {
        verifyAgencyAccess(agencyId, userId, role);
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", agencyId));

        AgencyWallet wallet = agencyWalletRepository.findByAgencyId(agencyId)
                .orElseThrow(() -> new BusinessException("Wallet not found for agency"));

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new BusinessException("Insufficient balance in agency wallet");
        }

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
                            .orElseThrow(() -> new BusinessException("No verified PayPal account found. Please link your PayPal account before requesting a payout.")));
        }

        if (account.getProvider() != PaymentProviderEnum.PAYPAL) {
            throw new BusinessException("Only PAYPAL provider is currently supported for automated payouts.");
        }

        AgencyPayoutRequest request = AgencyPayoutRequest.builder()
                .agency(agency)
                .amount(amount)
                .status(TransactionStatus.PENDING)
                .paymentAccountId(account.getId())
                .receiverEmailSnapshot(account.getAccountIdentifier())
                .provider(account.getProvider())
                .build();

        payoutRequestRepository.save(request);
        log.info("Payout of {} requested by agency {}", amount, agencyId);
    }

    @Override
    public void setCommissionRate(UUID agencyId, java.math.BigDecimal rate) {
        if (rate == null || rate.compareTo(java.math.BigDecimal.ZERO) < 0 || rate.compareTo(java.math.BigDecimal.ONE) > 0) {
            throw new BusinessException("Commission rate must be between 0.0 and 1.0 (0% – 100%)");
        }
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", agencyId));
        // FIX BB-05: Previously commented out — commission rate is now actually saved.
        agency.setCommissionRate(rate);
        agencyRepository.save(agency);
        log.info("Commission rate updated to {} for agency {}", rate, agencyId);
    }

    @Override
    public void updateAgencySettings(UUID agencyId, com.deliveryplatform.dto.request.AgencySettingsRequest request, UUID userId, String role) {
        verifyAgencyAccess(agencyId, userId, role);
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", agencyId));

        if (request.getName() != null) agency.setName(request.getName());
        if (request.getEmail() != null) agency.setEmail(request.getEmail());
        if (request.getPhone() != null) agency.setPhone(request.getPhone());
        if (request.getAddress() != null) agency.setAddress(request.getAddress());
        if (request.getTaxId() != null) agency.setTaxId(request.getTaxId());
        if (request.getLogoUrl() != null) agency.setLogoUrl(request.getLogoUrl());
        if (request.getCity() != null) agency.setCity(request.getCity());
        if (request.getZipCode() != null) agency.setZipCode(request.getZipCode());
        if (request.getCountry() != null) agency.setCountry(request.getCountry());

        agencyRepository.save(agency);
        log.info("Agency settings updated for agency {}", agencyId);
    }

    @Override
    public byte[] generateCODExport(UUID agencyId, String status, String startDate, String endDate, String format, UUID userId, String role) {
        verifyAgencyAccess(agencyId, userId, role);
        log.info("Generating COD export for agency {} in format {}", agencyId, format);
        
        List<Order> orders;
        if (status != null && !"all".equalsIgnoreCase(status)) {
            orders = orderRepository.findByAgencyIdOrDriverAgencyIdAndStatusList(agencyId, OrderStatus.valueOf(status.toUpperCase()));
        } else {
            orders = orderRepository.findByAgencyIdOrDriverAgencyIdList(agencyId);
        }

        // Filter by date if provided
        if (startDate != null && !startDate.isBlank() && endDate != null && !endDate.isBlank()) {
            LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
            LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
            orders = orders.stream()
                    .filter(o -> o.getCreatedAt().isAfter(start) && o.getCreatedAt().isBefore(end))
                    .collect(Collectors.toList());
        }

        if ("pdf".equalsIgnoreCase(format)) {
            return generatePDF(orders);
        } else {
            return generateCSV(orders).getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }
    }

    private String generateCSV(List<Order> orders) {
        StringBuilder csv = new StringBuilder();
        csv.append("Tracking Number,Date,Status,Receiver,Phone,City,COD Amount,Payment Status\n");
        
        for (Order o : orders) {
            csv.append(sanitizeForCSV(o.getTrackingNumber())).append(",");
            csv.append(o.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE)).append(",");
            csv.append(sanitizeForCSV(o.getStatus().name())).append(",");
            csv.append(sanitizeForCSV(o.getReceiverName())).append(",");
            csv.append(sanitizeForCSV(o.getReceiverPhone())).append(",");
            csv.append(sanitizeForCSV(o.getReceiverCity())).append(",");
            csv.append(o.getCodAmount() != null ? o.getCodAmount() : java.math.BigDecimal.ZERO).append(",");
            csv.append(sanitizeForCSV(o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "N/A")).append("\n");
        }
        return csv.toString();
    }

    private byte[] generatePDF(List<Order> orders) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate());
        try {
            PdfWriter.getInstance(document, out);
            document.open();
            
            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph("COD Reconciliation Report", fontTitle);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);
            
            String[] headers = {"Tracking #", "Date", "Status", "Receiver", "Phone", "City", "Amount", "Payment"};
            Font fontHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, fontHeader));
                cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
                cell.setPadding(5);
                table.addCell(cell);
            }

            Font fontCell = FontFactory.getFont(FontFactory.HELVETICA, 9);
            java.math.BigDecimal totalCod = java.math.BigDecimal.ZERO;
            for (Order o : orders) {
                table.addCell(new Phrase(o.getTrackingNumber(), fontCell));
                table.addCell(new Phrase(o.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE), fontCell));
                table.addCell(new Phrase(o.getStatus().name(), fontCell));
                table.addCell(new Phrase(o.getReceiverName(), fontCell));
                table.addCell(new Phrase(o.getReceiverPhone(), fontCell));
                table.addCell(new Phrase(o.getReceiverCity(), fontCell));
                java.math.BigDecimal amt = o.getCodAmount() != null ? o.getCodAmount() : java.math.BigDecimal.ZERO;
                table.addCell(new Phrase(amt.toString(), fontCell));
                table.addCell(new Phrase(o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "N/A", fontCell));
                totalCod = totalCod.add(amt);
            }
            document.add(table);
            
            Paragraph total = new Paragraph("\nTotal COD Amount: " + totalCod + " MAD", fontTitle);
            total.setAlignment(Element.ALIGN_RIGHT);
            document.add(total);
            
            document.close();
        } catch (Exception e) {
            log.error("Error generating PDF", e);
        }
        return out.toByteArray();
    }

    @Override
    public void suspendDriver(UUID driverId, UUID agencyId, String reason, UUID performerId, String role) {
        verifyAgencyAccess(agencyId, performerId, role);
        Driver driver = findAgencyDriver(driverId, agencyId);
        
        DisciplinaryStatus oldStatus = driver.getDisciplinaryStatus();
        driver.setDisciplinaryStatus(DisciplinaryStatus.SUSPENDED);
        driver.setLastDisciplinaryReason(reason);
        driverRepository.save(driver);
        
        logDisciplinaryAction(driver, agencyId, performerId, oldStatus, driver.getDisciplinaryStatus(), "SUSPEND", reason);
        log.info("Driver {} suspended by agency {} for reason: {}", driverId, agencyId, reason);

        // Realtime: Force-logout suspended driver immediately
        if (driver.getUser() != null) {
            wsEventService.sendForceLogout(driver.getUser().getId(), "Your account has been suspended by your agency.");
        }
    }

    @Override
    public void reactivateDriver(UUID driverId, UUID agencyId, String reason, UUID performerId, String role) {
        verifyAgencyAccess(agencyId, performerId, role);
        Driver driver = findAgencyDriver(driverId, agencyId);
        
        DisciplinaryStatus oldStatus = driver.getDisciplinaryStatus();
        driver.setDisciplinaryStatus(DisciplinaryStatus.ACTIVE);
        driver.setLastDisciplinaryReason(reason);
        driverRepository.save(driver);
        
        logDisciplinaryAction(driver, agencyId, performerId, oldStatus, driver.getDisciplinaryStatus(), "REACTIVATE", reason);
        log.info("Driver {} reactivated by agency {} for reason: {}", driverId, agencyId, reason);

        // Realtime: Notify driver of reactivation
        if (driver.getUser() != null) {
            wsEventService.sendUserNotification(driver.getUser().getId(), java.util.Map.of(
                    "type", "ACCOUNT_REACTIVATED",
                    "message", "Your account has been reactivated by your agency.",
                    "timestamp", java.time.LocalDateTime.now().toString()
            ));
        }
    }

    @Override
    public void blacklistDriver(UUID driverId, UUID agencyId, String reason, UUID performerId, String role) {
        verifyAgencyAccess(agencyId, performerId, role);
        Driver driver = findAgencyDriver(driverId, agencyId);
        
        DisciplinaryStatus oldStatus = driver.getDisciplinaryStatus();
        driver.setDisciplinaryStatus(DisciplinaryStatus.BLACKLISTED_LOCAL);
        driver.setLastDisciplinaryReason(reason);
        driverRepository.save(driver);
        
        logDisciplinaryAction(driver, agencyId, performerId, oldStatus, driver.getDisciplinaryStatus(), "BLACKLIST", reason);
        log.info("Driver {} blacklisted locally by agency {} for reason: {}", driverId, agencyId, reason);

        // Realtime: Force-logout blacklisted driver immediately
        if (driver.getUser() != null) {
            wsEventService.sendForceLogout(driver.getUser().getId(), "Your account has been blocked by your agency.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverDisciplinaryHistoryResponse> getDriverDisciplinaryHistory(UUID driverId, UUID agencyId, UUID performerId, String role) {
        verifyAgencyAccess(agencyId, performerId, role);
        // Verify driver belongs to agency
        findAgencyDriver(driverId, agencyId);
        
        return disciplinaryActionRepository.findAllByDriverIdOrderByCreatedAtDesc(driverId).stream()
                .map(action -> DriverDisciplinaryHistoryResponse.builder()
                        .id(action.getId())
                        .action(action.getAction())
                        .previousStatus(action.getPreviousStatus().name())
                        .newStatus(action.getNewStatus().name())
                        .reason(action.getReason())
                        .performedBy(action.getPerformedBy().getFirstName() + " " + action.getPerformedBy().getLastName())
                        .createdAt(action.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private Driver findAgencyDriver(UUID driverId, UUID agencyId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));
        
        if (driver.getAgency() == null || !driver.getAgency().getId().equals(agencyId)) {
            throw new BusinessException("Driver does not belong to this agency");
        }
        return driver;
    }

    private void logDisciplinaryAction(Driver driver, UUID agencyId, UUID performerId, 
                                     DisciplinaryStatus oldStatus, 
                                     DisciplinaryStatus newStatus, 
                                     String action, String reason) {
        User performer = userRepository.findById(performerId).orElseThrow();
        Agency agency = agencyRepository.findById(agencyId).orElseThrow();
        
        DriverDisciplinaryAction logEntry = DriverDisciplinaryAction.builder()
                .driver(driver)
                .agency(agency)
                .performedBy(performer)
                .previousStatus(oldStatus)
                .newStatus(newStatus)
                .action(action)
                .reason(reason)
                .build();
        
        disciplinaryActionRepository.save(logEntry);
        auditLogService.log(performerId, "DRIVER_DISCIPLINARY_ACTION", "Driver: " + driver.getId() + ", Action: " + action + ", Reason: " + reason, "INTERNAL");
    }

    @Override
    @Transactional
    public DriverResponse extendWorkPermission(UUID driverId, UUID agencyId, UUID performerId, String role) {
        Driver driver = findAgencyDriver(driverId, agencyId);
        LocalDateTime base = (driver.getWorkPermissionUntil() != null && driver.getWorkPermissionUntil().isAfter(LocalDateTime.now()))
                ? driver.getWorkPermissionUntil()
                : LocalDateTime.now();
        LocalDateTime extended = base.plusDays(30).withHour(23).withMinute(59).withSecond(59).withNano(0);
        driver.setWorkPermissionUntil(extended);
        driverRepository.save(driver);
        auditLogService.log(performerId, "DRIVER_PERMIT_EXTENDED",
                "Driver: " + driverId + " extended until " + extended, "INTERNAL");
        return driverMapper.toResponse(driver);
    }

    private String sanitizeForCSV(String value) {
        if (value == null) return "";
        String sanitized = value.replace(",", " ");
        if (sanitized.startsWith("=") || sanitized.startsWith("+") || sanitized.startsWith("-") || sanitized.startsWith("@")) {
            return "'" + sanitized;
        }
        return sanitized;
    }
}
