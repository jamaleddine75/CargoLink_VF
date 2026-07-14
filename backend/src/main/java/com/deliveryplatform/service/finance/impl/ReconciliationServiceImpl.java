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
    private final TransactionRepository transactionRepository;
    private final ReconciliationReportRepository reportRepository;

    @Override
    @Transactional
    public ReconciliationReport reconcileCOD() {
        log.info("Starting Cash-on-Delivery reconciliation process...");

        // 1. Expected: total COD that has been CONFIRMED by agencies (i.e., cash physically received)
        //    This is what should have been credited to client wallets as COD_SETTLED.
        BigDecimal expectedSettled = orderRepository.findByPaymentStatusIn(
                        List.of(PaymentStatus.CONFIRMED_BY_AGENCY, PaymentStatus.SETTLED_TO_CLIENT))
                .stream()
                .filter(o -> o.getCodAmount() != null && o.getCodAmount().compareTo(BigDecimal.ZERO) > 0)
                .map(Order::getCodAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Actual: sum of all COD_SETTLED transactions that are COMPLETED
        BigDecimal actualSettled = transactionRepository.findByTypeAndStatus(
                        TransactionType.COD_SETTLED, TransactionStatus.COMPLETED)
                .stream()
                .filter(t -> t.getAmount() != null)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Pending: sum of COD_REMIS transactions in PENDING state (driver declared but not yet confirmed)
        BigDecimal pendingRemittances = transactionRepository.findByTypeAndStatus(
                        TransactionType.COD_REMIS, TransactionStatus.PENDING)
                .stream()
                .filter(t -> t.getAmount() != null)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Outstanding: COD collected by driver (COD_COLLECTED PENDING) - not yet declared
        BigDecimal outstandingDriverCash = transactionRepository.findByTypeAndStatus(
                        TransactionType.COD_COLLECTED, TransactionStatus.PENDING)
                .stream()
                .filter(t -> t.getAmount() != null)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal difference = expectedSettled.subtract(actualSettled);
        String status = difference.abs().compareTo(BigDecimal.ONE) <= 0 ? "MATCHED" : "DISCREPANCY";

        String details = String.format(
                "Reconciliation completed. " +
                "Expected settled (COD confirmed by agency): %s MAD. " +
                "Actual settled (COD_SETTLED transactions): %s MAD. " +
                "Difference: %s MAD. " +
                "Pending driver declarations: %s MAD. " +
                "Outstanding driver cash (not declared): %s MAD.",
                expectedSettled, actualSettled, difference, pendingRemittances, outstandingDriverCash);

        log.info(details);

        ReconciliationReport report = ReconciliationReport.builder()
                .expectedCod(expectedSettled)
                .collectedCod(actualSettled)
                .difference(difference)
                .status(status)
                .details(details)
                .build();

        return reportRepository.save(report);
    }
}
