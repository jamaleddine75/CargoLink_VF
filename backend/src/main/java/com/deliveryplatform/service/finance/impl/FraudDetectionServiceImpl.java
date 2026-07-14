package com.deliveryplatform.service.finance.impl;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.finance.DriverFinancialEngine;
import com.deliveryplatform.service.finance.FraudDetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FraudDetectionServiceImpl implements FraudDetectionService {

    private final WalletRepository walletRepository;
    private final DriverRepository driverRepository;
    private final WithdrawalRequestRepository withdrawalRepository;
    private final FraudAlertRepository fraudAlertRepository;
    private final DriverFinancialEngine driverFinancialEngine;

    @Override
    @Transactional
    public void scanForFinancialFraud() {
        log.info("Running automated risk and fraud scan...");

        // Rule 1: Negative Balance check
        List<Wallet> wallets = walletRepository.findAll();
        for (Wallet wallet : wallets) {
            if (wallet.getBalance().compareTo(BigDecimal.ZERO) < 0) {
                createAlert("NEGATIVE_BALANCE", "CRITICAL", 
                        "Wallet " + wallet.getId() + " has a negative balance: " + wallet.getBalance() + " MAD",
                        wallet.getId().toString());
            }
        }

        // Rule 2: Driver holding COD too long / High Amount to Return
        List<Driver> drivers = driverRepository.findAll();
        for (Driver driver : drivers) {
            Map<String, BigDecimal> metrics = driverFinancialEngine.calculateDriverBalanceMetrics(driver.getId());
            BigDecimal amountOwedToPlatform = metrics.get("amountOwedToPlatform");
            if (amountOwedToPlatform != null && amountOwedToPlatform.compareTo(new BigDecimal("1000.00")) > 0) {
                createAlert("HIGH_CASH_IN_HAND", "HIGH", 
                        "Driver " + driver.getUser().getFirstName() + " " + driver.getUser().getLastName() + 
                        " has high cash-in-hand to return: " + amountOwedToPlatform + " MAD",
                        driver.getId().toString());
            }
        }

        // Rule 3: Duplicate Withdrawal Requests
        List<WithdrawalRequest> pendingWithdrawals = withdrawalRepository.findByStatusOrderByCreatedAtDesc(TransactionStatus.PENDING);
        for (int i = 0; i < pendingWithdrawals.size(); i++) {
            WithdrawalRequest w1 = pendingWithdrawals.get(i);
            for (int j = i + 1; j < pendingWithdrawals.size(); j++) {
                WithdrawalRequest w2 = pendingWithdrawals.get(j);
                if (w1.getUser().getId().equals(w2.getUser().getId()) && 
                    w1.getAmount().compareTo(w2.getAmount()) == 0) {
                    createAlert("DUPLICATE_WITHDRAWAL", "MEDIUM", 
                            "Duplicate pending withdrawal requests detected for user " + w1.getUser().getId() + 
                            " of amount: " + w1.getAmount() + " MAD",
                            w1.getId().toString());
                }
            }
        }
    }

    private void createAlert(String ruleName, String severity, String message, String referenceId) {
        // Skip duplicate open alerts
        List<FraudAlert> openAlerts = fraudAlertRepository.findByStatus("OPEN");
        boolean exists = openAlerts.stream()
                .anyMatch(a -> a.getRuleName().equals(ruleName) && referenceId.equals(a.getReferenceId()));
        if (!exists) {
            FraudAlert alert = FraudAlert.builder()
                    .ruleName(ruleName)
                    .severity(severity)
                    .message(message)
                    .referenceId(referenceId)
                    .status("OPEN")
                    .build();
            fraudAlertRepository.save(alert);
            log.warn("Fraud Alert triggered: {} - {}", ruleName, message);
        }
    }
}
