package com.deliveryplatform.service.finance.impl;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.finance.ReconciliationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReconciliationServiceImpl implements ReconciliationService {

    private final OrderRepository orderRepository;
    private final WalletRepository walletRepository;
    private final ReconciliationReportRepository reportRepository;

    @Override
    @Transactional
    public ReconciliationReport reconcileCOD() {
        log.info("Starting Cash-on-Delivery reconciliation process...");

        // 1. Calculate Expected COD from all Delivered Orders
        List<Order> orders = orderRepository.findAll();
        BigDecimal expectedCod = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .map(o -> o.getCodAmount() != null ? o.getCodAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Sum up what has been recorded in the wallet cache balances
        BigDecimal collectedCod = walletRepository.findAll().stream()
                .filter(w -> w.getWalletType() == WalletType.CUSTOMER)
                .map(Wallet::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal difference = expectedCod.subtract(collectedCod);
        String status = difference.compareTo(BigDecimal.ZERO) == 0 ? "MATCHED" : "DISCREPANCY";

        ReconciliationReport report = ReconciliationReport.builder()
                .expectedCod(expectedCod)
                .collectedCod(collectedCod)
                .difference(difference)
                .status(status)
                .details("Reconciliation run completed. Expected COD from orders: " + expectedCod + 
                         " MAD. Collected / Settled COD in wallets: " + collectedCod + " MAD.")
                .build();

        return reportRepository.save(report);
    }
}
