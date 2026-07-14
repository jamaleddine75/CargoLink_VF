package com.deliveryplatform.service.finance;

import com.deliveryplatform.domain.entity.JournalEntry;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public interface LedgerEngine {
    JournalEntry recordTransaction(
        String idempotencyKey,
        String description,
        String referenceType,
        String referenceId,
        UUID createdBy,
        Map<String, BigDecimal> debits,
        Map<String, BigDecimal> credits
    );
}
