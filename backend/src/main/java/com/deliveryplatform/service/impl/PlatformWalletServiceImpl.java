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

    @Override
    @Transactional
    public PlatformWallet getGlobalWallet() {
        return platformWalletRepository.findGlobalWallet()
                .orElseGet(() -> platformWalletRepository.save(PlatformWallet.builder().build()));
    }

    @Override
    @Transactional
    public void recordRevenue(BigDecimal amount) {
        PlatformWallet wallet = getGlobalWallet();
        wallet.setTotalRevenue(wallet.getTotalRevenue().add(amount));
        platformWalletRepository.save(wallet);
    }

    @Override
    @Transactional
    public void recordProfit(BigDecimal amount) {
        PlatformWallet wallet = getGlobalWallet();
        wallet.setPlatformProfit(wallet.getPlatformProfit().add(amount));
        platformWalletRepository.save(wallet);
    }

    @Override
    @Transactional
    public void updateBalance(BigDecimal amount) {
        PlatformWallet wallet = getGlobalWallet();
        wallet.setBalance(wallet.getBalance().add(amount));
        platformWalletRepository.save(wallet);
    }

    @Override
    @Transactional
    public void recordDriverPayout(BigDecimal amount) {
        PlatformWallet wallet = getGlobalWallet();
        wallet.setTotalDriverPayout(wallet.getTotalDriverPayout().add(amount));
        wallet.setBalance(wallet.getBalance().subtract(amount));
        platformWalletRepository.save(wallet);
    }

    @Override
    @Transactional
    public void recordAgencyPayout(BigDecimal amount) {
        PlatformWallet wallet = getGlobalWallet();
        wallet.setTotalAgencyPayout(wallet.getTotalAgencyPayout().add(amount));
        wallet.setBalance(wallet.getBalance().subtract(amount));
        platformWalletRepository.save(wallet);
    }
}
