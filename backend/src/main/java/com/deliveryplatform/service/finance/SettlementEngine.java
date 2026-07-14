package com.deliveryplatform.service.finance;

import com.deliveryplatform.domain.entity.SettlementBatch;
import java.util.UUID;

public interface SettlementEngine {
    SettlementBatch runSettlement(String scheduleType, UUID adminId);
}
