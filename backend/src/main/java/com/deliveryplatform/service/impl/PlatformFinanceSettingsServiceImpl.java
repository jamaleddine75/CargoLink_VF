package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.*;
import com.deliveryplatform.dto.request.FinanceSettingsUpdateRequest;
import com.deliveryplatform.dto.response.finance.FinanceSettingsDTO;
import com.deliveryplatform.repository.PlatformFinanceSettingsRepository;
import com.deliveryplatform.service.AuditLogService;
import com.deliveryplatform.service.PlatformFinanceSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlatformFinanceSettingsServiceImpl implements PlatformFinanceSettingsService {

    private static final BigDecimal DEFAULT_PLATFORM_FEE_RATE = new BigDecimal("0.0500");
    private static final BigDecimal DEFAULT_AGENCY_COMMISSION_RATE = new BigDecimal("0.1500");
    private static final BigDecimal DEFAULT_DEBT_ALERT_THRESHOLD = new BigDecimal("1000.00");

    private final PlatformFinanceSettingsRepository settingsRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public PlatformFinanceSettings getCurrentSettings() {
        return settingsRepository.findTopByOrderByUpdatedAtDesc()
                .orElseGet(this::createDefaultSettings);
    }

    @Override
    @Transactional(readOnly = true)
    public FinanceSettingsDTO getCurrentSettingsDto() {
        return toDto(getCurrentSettings());
    }

    @Override
    @Transactional
    public FinanceSettingsDTO updateSettings(FinanceSettingsUpdateRequest request, UUID actorId) {
        PlatformFinanceSettings settings = getCurrentSettings();

        String before = describe(settings);
        settings.setPlatformFeeRate(scaleRate(request.getPlatformFeeRate()));
        settings.setDefaultAgencyCommissionRate(scaleRate(request.getDefaultAgencyCommissionRate()));
        settings.setClientSettlementFormula(request.getClientSettlementFormula());
        settings.setAutoReconcileDailyBatch(Boolean.TRUE.equals(request.getAutoReconcileDailyBatch()));
        settings.setDebtAlertThreshold(request.getDebtAlertThreshold().setScale(2, RoundingMode.HALF_UP));
        settings.setUpdatedBy(actorId);

        PlatformFinanceSettings saved = settingsRepository.save(settings);
        String after = describe(saved);
        auditLogService.logFinancialAction(
                actorId,
                "FINANCE_SETTINGS_UPDATED",
                actorId,
                saved.getPlatformFeeRate(),
                "Before: " + before + " | After: " + after
        );
        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getPlatformFeeRate() {
        return getCurrentSettings().getPlatformFeeRate();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getDefaultAgencyCommissionRate() {
        return getCurrentSettings().getDefaultAgencyCommissionRate();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal resolveAgencyCommissionRate(Agency agency, AgencyWallet agencyWallet) {
        if (agencyWallet != null && agencyWallet.getCommissionRate() != null) {
            return agencyWallet.getCommissionRate();
        }
        if (agency != null && agency.getCommissionRate() != null) {
            return agency.getCommissionRate();
        }
        return getDefaultAgencyCommissionRate();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateClientSettlement(BigDecimal codAmount, BigDecimal deliveryFee) {
        BigDecimal safeCod = codAmount != null ? codAmount : BigDecimal.ZERO;
        BigDecimal safeFee = deliveryFee != null ? deliveryFee : BigDecimal.ZERO;
        ClientSettlementFormula formula = getCurrentSettings().getClientSettlementFormula();

        if (formula == ClientSettlementFormula.COD_FULL) {
            return safeCod.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        }
        return safeCod.subtract(safeFee).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private PlatformFinanceSettings createDefaultSettings() {
        return settingsRepository.save(PlatformFinanceSettings.builder()
                .platformFeeRate(DEFAULT_PLATFORM_FEE_RATE)
                .defaultAgencyCommissionRate(DEFAULT_AGENCY_COMMISSION_RATE)
                .clientSettlementFormula(ClientSettlementFormula.COD_MINUS_FEE)
                .autoReconcileDailyBatch(true)
                .debtAlertThreshold(DEFAULT_DEBT_ALERT_THRESHOLD)
                .build());
    }

    private FinanceSettingsDTO toDto(PlatformFinanceSettings settings) {
        return FinanceSettingsDTO.builder()
                .id(settings.getId())
                .platformFeeRate(settings.getPlatformFeeRate())
                .defaultAgencyCommissionRate(settings.getDefaultAgencyCommissionRate())
                .clientSettlementFormula(settings.getClientSettlementFormula())
                .autoReconcileDailyBatch(settings.isAutoReconcileDailyBatch())
                .debtAlertThreshold(settings.getDebtAlertThreshold())
                .updatedBy(settings.getUpdatedBy())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }

    private BigDecimal scaleRate(BigDecimal rate) {
        return rate.setScale(4, RoundingMode.HALF_UP);
    }

    private String describe(PlatformFinanceSettings settings) {
        return "platformFeeRate=" + settings.getPlatformFeeRate()
                + ", defaultAgencyCommissionRate=" + settings.getDefaultAgencyCommissionRate()
                + ", clientSettlementFormula=" + settings.getClientSettlementFormula()
                + ", autoReconcileDailyBatch=" + settings.isAutoReconcileDailyBatch()
                + ", debtAlertThreshold=" + settings.getDebtAlertThreshold();
    }
}
