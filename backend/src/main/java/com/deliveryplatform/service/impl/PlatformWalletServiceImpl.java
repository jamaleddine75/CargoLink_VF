package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.PlatformWallet;
import com.deliveryplatform.repository.PlatformWalletRepository;
import com.deliveryplatform.service.PlatformWalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PlatformWalletServiceImpl implements PlatformWalletService {

    private final PlatformWalletRepository platformWalletRepository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public PlatformWallet getGlobalWallet() {
        // Read-only access – use unlocked query
        return platformWalletRepository.findGlobalWallet()
                .orElseGet(() -> platformWalletRepository.save(PlatformWallet.builder().build()));
    }

    private PlatformWallet getGlobalWalletLocked() {
        // Locked access – for all write operations
        return platformWalletRepository.findGlobalWalletWithLock()
                .orElseGet(() -> platformWalletRepository.save(PlatformWallet.builder().build()));
    }

    @Override
    @Transactional
    public void recordRevenue(BigDecimal amount) {
        PlatformWallet wallet = getGlobalWalletLocked();
        wallet.setTotalRevenue(wallet.getTotalRevenue().add(amount));
        wallet = platformWalletRepository.save(wallet);
        
        eventPublisher.publishEvent(new com.deliveryplatform.event.finance.PlatformRevenueEvent(
            this, 
            java.util.UUID.randomUUID().toString(), 
            null, 
            wallet.getId(), 
            amount
        ));
    }

    @Override
    @Transactional
    public void recordProfit(BigDecimal amount) {
        PlatformWallet wallet = getGlobalWalletLocked();
        wallet.setPlatformProfit(wallet.getPlatformProfit().add(amount));
        wallet = platformWalletRepository.save(wallet);
        
        eventPublisher.publishEvent(new com.deliveryplatform.event.finance.FinancialMutationEvent(
            this, 
            java.util.UUID.randomUUID().toString(), 
            null, 
            com.deliveryplatform.event.finance.FinancialMutationEvent.EntityType.PLATFORM, 
            wallet.getId(), 
            amount, 
            "MAD", 
            com.deliveryplatform.domain.entity.TransactionType.GAIN,
            null, 
            "Platform Profit Share", 
            java.util.Map.of()
        ));
    }

    @Override
    @Transactional
    public void updateBalance(BigDecimal amount) {
        PlatformWallet wallet = getGlobalWalletLocked();
        wallet.setBalance(wallet.getBalance().add(amount));
        wallet = platformWalletRepository.save(wallet);
        
        eventPublisher.publishEvent(new com.deliveryplatform.event.finance.FinancialMutationEvent(
            this, 
            java.util.UUID.randomUUID().toString(), 
            null, 
            com.deliveryplatform.event.finance.FinancialMutationEvent.EntityType.PLATFORM, 
            wallet.getId(), 
            amount, 
            "MAD", 
            amount.compareTo(BigDecimal.ZERO) >= 0 ? com.deliveryplatform.domain.entity.TransactionType.DEPOSIT : com.deliveryplatform.domain.entity.TransactionType.DEDUCTION,
            null, 
            "Platform Balance Adjustment", 
            java.util.Map.of()
        ));
    }

    @Override
    @Transactional
    public void recordDriverPayout(BigDecimal amount) {
        PlatformWallet wallet = getGlobalWalletLocked();
        wallet.setTotalDriverPayout(wallet.getTotalDriverPayout().add(amount));
        wallet.setBalance(wallet.getBalance().subtract(amount));
        wallet = platformWalletRepository.save(wallet);
        
        eventPublisher.publishEvent(new com.deliveryplatform.event.finance.FinancialMutationEvent(
            this, 
            java.util.UUID.randomUUID().toString(), 
            null, 
            com.deliveryplatform.event.finance.FinancialMutationEvent.EntityType.PLATFORM, 
            wallet.getId(), 
            amount.negate(), 
            "MAD", 
            com.deliveryplatform.domain.entity.TransactionType.PAYOUT,
            null, 
            "Driver Payout", 
            java.util.Map.of()
        ));
    }

    @Override
    @Transactional
    public void recordAgencyPayout(BigDecimal amount) {
        PlatformWallet wallet = getGlobalWalletLocked();
        wallet.setTotalAgencyPayout(wallet.getTotalAgencyPayout().add(amount));
        wallet.setBalance(wallet.getBalance().subtract(amount));
        wallet = platformWalletRepository.save(wallet);
        
        eventPublisher.publishEvent(new com.deliveryplatform.event.finance.FinancialMutationEvent(
            this, 
            java.util.UUID.randomUUID().toString(), 
            null, 
            com.deliveryplatform.event.finance.FinancialMutationEvent.EntityType.PLATFORM, 
            wallet.getId(), 
            amount.negate(), 
            "MAD", 
            com.deliveryplatform.domain.entity.TransactionType.PAYOUT,
            null, 
            "Agency Payout", 
            java.util.Map.of()
        ));
    }
}
