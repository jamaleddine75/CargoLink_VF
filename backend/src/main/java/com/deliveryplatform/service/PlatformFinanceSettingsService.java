package com.deliveryplatform.service;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.domain.entity.AgencyWallet;
import com.deliveryplatform.domain.entity.PlatformFinanceSettings;
import com.deliveryplatform.dto.request.FinanceSettingsUpdateRequest;
import com.deliveryplatform.dto.response.finance.FinanceSettingsDTO;

import java.math.BigDecimal;
import java.util.UUID;

public interface PlatformFinanceSettingsService {
    PlatformFinanceSettings getCurrentSettings();
    FinanceSettingsDTO getCurrentSettingsDto();
    FinanceSettingsDTO updateSettings(FinanceSettingsUpdateRequest request, UUID actorId);
    BigDecimal getPlatformFeeRate();
    BigDecimal getDefaultAgencyCommissionRate();
    BigDecimal resolveAgencyCommissionRate(Agency agency, AgencyWallet agencyWallet);
    BigDecimal calculateClientSettlement(BigDecimal codAmount, BigDecimal deliveryFee);
}
