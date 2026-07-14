package com.deliveryplatform.service.finance;

import java.util.UUID;

public interface WalletProjectionService {
    void recalculateWalletProjection(UUID walletId);
}
