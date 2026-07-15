package com.deliveryplatform.service.finance.impl;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.PlatformFinanceSettingsService;
import com.deliveryplatform.service.finance.SettlementEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementEngineImpl implements SettlementEngine {

    private final SettlementBatchRepository batchRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final OrderRepository orderRepository;
    private final WalletTimelineRepository timelineRepository;
    private final PlatformFinanceSettingsService platformFinanceSettingsService;

    @Override
    @Transactional
    public SettlementBatch runSettlement(String scheduleType, UUID adminId) {
        log.info("Initiating settlement batch run for schedule: {}", scheduleType);

        SettlementBatch batch = SettlementBatch.builder()
                .scheduleType(scheduleType)
                .status("PROCESSING")
                .totalAmount(BigDecimal.ZERO)
                .build();
        batch = batchRepository.save(batch);

        BigDecimal totalSettled = BigDecimal.ZERO;

        // Find all CUSTOMER wallets with a positive balance (settled COD amounts)
        List<Wallet> customerWallets = walletRepository.findAll().stream()
                .filter(w -> w.getWalletType() == WalletType.CUSTOMER && !w.isFrozen())
                .filter(w -> w.getBalance() != null && w.getBalance().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        BigDecimal platformFeeRate = platformFinanceSettingsService.getPlatformFeeRate();

        for (Wallet wallet : customerWallets) {
            UUID userId = wallet.getUser() != null ? wallet.getUser().getId() : null;
            if (userId == null) continue;

            // Find confirmed orders that haven't been settled to this client yet
            List<Order> settleableOrders = orderRepository.findByClientIdAndPaymentStatus(
                    userId, PaymentStatus.CONFIRMED_BY_AGENCY);

            for (Order order : settleableOrders) {
                try {
                    BigDecimal codAmount = order.getCodAmount() != null ? order.getCodAmount() : BigDecimal.ZERO;
                    if (codAmount.compareTo(BigDecimal.ZERO) <= 0) continue;

                    BigDecimal deliveryFee = order.getDeliveryFee() != null ? order.getDeliveryFee() : BigDecimal.ZERO;
                    BigDecimal netSettled = platformFinanceSettingsService.calculateClientSettlement(codAmount, deliveryFee);

                    if (netSettled.compareTo(BigDecimal.ZERO) <= 0) {
                        log.warn("Skipping order {} settlement: netSettled={}", order.getId(), netSettled);
                        order.setPaymentStatus(PaymentStatus.SETTLED_TO_CLIENT);
                        order.setPaymentConfirmedAt(LocalDateTime.now());
                        orderRepository.save(order);
                        continue;
                    }

                    // Platform fee portion
                    BigDecimal platformShare = deliveryFee.multiply(platformFeeRate).setScale(2, RoundingMode.HALF_UP);



                    // Credit client wallet
                    wallet.setBalance(wallet.getBalance().add(netSettled));
                    walletRepository.save(wallet);

                    // Record COD_SETTLED transaction
                    transactionRepository.save(Transaction.builder()
                            .wallet(wallet)
                            .type(TransactionType.COD_SETTLED)
                            .amount(netSettled)
                            .description("Batch settlement for order " + order.getTrackingNumber())
                            .status(TransactionStatus.COMPLETED)
                            .orderId(order.getId())
                            .date(LocalDateTime.now())
                            .build());

                    order.setPaymentStatus(PaymentStatus.SETTLED_TO_CLIENT);
                    order.setPaymentConfirmedAt(LocalDateTime.now());
                    orderRepository.save(order);

                    totalSettled = totalSettled.add(netSettled);

                    // Timeline entry
                    WalletTimeline timeline = WalletTimeline.builder()
                            .walletId(wallet.getId())
                            .amount(netSettled)
                            .eventType("SETTLEMENT_COMPLETED")
                            .description("Settled COD for order " + order.getTrackingNumber())
                            .reference(batch.getId().toString())
                            .actor("SYSTEM")
                            .build();
                    timelineRepository.save(timeline);

                } catch (Exception e) {
                    log.error("Failed to settle order {} in batch {}: {}", order.getId(), batch.getId(), e.getMessage(), e);
                }
            }
        }

        batch.setStatus("COMPLETED");
        batch.setTotalAmount(totalSettled);
        batch.setProcessedAt(LocalDateTime.now());
        log.info("Settlement batch {} completed. Total settled: {}", batch.getId(), totalSettled);
        return batchRepository.save(batch);
    }
}
