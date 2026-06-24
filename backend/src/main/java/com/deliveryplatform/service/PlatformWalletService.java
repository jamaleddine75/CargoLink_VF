package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.PlatformWallet;
import java.math.BigDecimal;

public interface PlatformWalletService {
    PlatformWallet getGlobalWallet();
    void recordRevenue(BigDecimal amount);
    void recordProfit(BigDecimal amount);
    void updateBalance(BigDecimal amount);
    void recordDriverPayout(BigDecimal amount);
    void recordAgencyPayout(BigDecimal amount);
}
