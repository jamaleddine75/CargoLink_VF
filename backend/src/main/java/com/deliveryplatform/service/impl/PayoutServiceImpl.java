package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.exception.BusinessException;
import com.deliveryplatform.repository.*;
import com.deliveryplatform.service.PayoutService;
import com.deliveryplatform.service.PlatformWalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayoutServiceImpl implements PayoutService {

    private final WalletRepository walletRepository;
    private final AgencyWalletRepository agencyWalletRepository;
    private final TransactionRepository transactionRepository;
    private final PlatformWalletService platformWalletService;
    

    @Override
    @Transactional
    public Map<String, Object> processMonthlyDriverPayouts() {
        List<Wallet> driverWallets = walletRepository.findByWalletType(WalletType.DRIVER);
        int processedCount = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (Wallet wallet : driverWallets) {
            try {
                if (wallet.getBalance().compareTo(BigDecimal.ZERO) > 0 && 
                    wallet.getDebtToSystem().compareTo(BigDecimal.ZERO) <= 0) {
                    
                    BigDecimal amount = wallet.getBalance();
                    payoutSingleDriver(wallet.getUser().getId());
                    processedCount++;
                    totalAmount = totalAmount.add(amount);
                }
            } catch (Exception e) {
                log.error("Failed to payout driver {}: {}", wallet.getUser().getId(), e.getMessage());
            }
        }

        return Map.of(
            "message", "Driver monthly payouts processed",
            "processedCount", processedCount,
            "totalAmount", totalAmount
        );
    }

    @Override
    @Transactional
    public Map<String, Object> processMonthlyAgencyPayouts() {
        List<AgencyWallet> agencyWallets = agencyWalletRepository.findAll();
        int processedCount = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (AgencyWallet wallet : agencyWallets) {
            try {
                if (wallet.getBalance().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal amount = wallet.getBalance();
                    payoutSingleAgency(wallet.getAgency().getId());
                    processedCount++;
                    totalAmount = totalAmount.add(amount);
                }
            } catch (Exception e) {
                log.error("Failed to payout agency {}: {}", wallet.getAgency().getId(), e.getMessage());
            }
        }

        return Map.of(
            "message", "Agency monthly payouts processed",
            "processedCount", processedCount,
            "totalAmount", totalAmount
        );
    }

    @Override
    @Transactional
    public Map<String, Object> payoutSingleDriver(UUID driverUserId) {
        Wallet wallet = walletRepository.findByUserIdWithLock(driverUserId)
                .orElseThrow(() -> new BusinessException("Wallet not found for driver"));

        if (wallet.getDebtToSystem().compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessException("Driver has pending debt to system. Payout blocked.");
        }

        BigDecimal amount = wallet.getBalance();
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("No balance to payout.");
        }

        // 1. Reset wallet balance
        wallet.setBalance(BigDecimal.ZERO);
        walletRepository.save(wallet);

        // 2. Record in Platform Wallet
        platformWalletService.recordDriverPayout(amount);

        // 3. Create transaction record
        transactionRepository.save(Transaction.builder()
                .wallet(wallet)
                .type(TransactionType.PAYOUT)
                .amount(amount.negate())
                .description("Monthly Payout to Driver")
                .status(TransactionStatus.COMPLETED)
                .date(LocalDateTime.now())
                .build());

        log.info("Driver {} paid out {} MAD", driverUserId, amount);
        return Map.of("status", "SUCCESS", "amount", amount);
    }

    @Override
    @Transactional
    public Map<String, Object> payoutSingleAgency(UUID agencyId) {
        AgencyWallet wallet = agencyWalletRepository.findByAgencyId(agencyId)
                .orElseThrow(() -> new BusinessException("Wallet not found for agency"));

        BigDecimal amount = wallet.getBalance();
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("No balance to payout.");
        }

        // 1. Reset agency wallet balance
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setTotalPaidOut(wallet.getTotalPaidOut().add(amount));
        agencyWalletRepository.save(wallet);

        // 2. Record in Platform Wallet
        platformWalletService.recordAgencyPayout(amount);

        // 3. Create transaction record for agency admin
        Wallet adminWallet = walletRepository.findByUserId(wallet.getAgency().getAdminAgency().getId())
                .orElseThrow(() -> new BusinessException("Agency admin wallet not found"));

        transactionRepository.save(Transaction.builder()
                .wallet(adminWallet)
                .type(TransactionType.PAYOUT)
                .amount(amount.negate())
                .description("Monthly Commission Payout to Agency")
                .status(TransactionStatus.COMPLETED)
                .date(LocalDateTime.now())
                .build());

        log.info("Agency {} paid out {} MAD", agencyId, amount);
        return Map.of("status", "SUCCESS", "amount", amount);
    }
}
