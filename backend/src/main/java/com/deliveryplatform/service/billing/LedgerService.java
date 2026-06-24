package com.deliveryplatform.service.billing;

import com.deliveryplatform.domain.entity.billing.LedgerTransactionType;
import java.math.BigDecimal;
import java.util.UUID;

public interface LedgerService {
    void recordTransaction(UUID agencyId, LedgerTransactionType type, String referenceType, UUID referenceId, String description, BigDecimal debit, BigDecimal credit);
}
