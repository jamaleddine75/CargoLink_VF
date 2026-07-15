package com.deliveryplatform.service.util;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.domain.entity.AgencyWallet;
import com.deliveryplatform.domain.entity.WithdrawalRequest;
import com.deliveryplatform.dto.response.WithdrawalRequestResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public final class WalletCalculationHelper {

    private static final int SCALE = 2;

    private WalletCalculationHelper() {}

    public static String sanitizeCsvCell(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        if (escaped.startsWith("=") || escaped.startsWith("+") || escaped.startsWith("-") || escaped.startsWith("@")) {
            escaped = "'" + escaped;
        }
        return escaped;
    }

    public static LocalDateTime getStartDateForPeriod(String period) {
        if (period == null) {
            return LocalDateTime.now().minus(365, ChronoUnit.DAYS);
        }
        LocalDateTime now = LocalDateTime.now();
        if ("ALL".equalsIgnoreCase(period) || "YEAR".equalsIgnoreCase(period)) return now.minus(365, ChronoUnit.DAYS);
        if ("week".equalsIgnoreCase(period)) return now.minus(7, ChronoUnit.DAYS);
        if ("month".equalsIgnoreCase(period)) return now.minus(30, ChronoUnit.DAYS);
        return now.minus(365, ChronoUnit.DAYS);
    }

    public static LocalDate calculateNextPayoutDate() {
        LocalDate today = LocalDate.now();
        int daysUntilMonday = (8 - today.getDayOfWeek().getValue()) % 7;
        if (daysUntilMonday == 0) daysUntilMonday = 7;
        return today.plusDays(daysUntilMonday);
    }

    public static WithdrawalRequestResponse toWithdrawalResponse(WithdrawalRequest wr) {
        if (wr == null) return null;
        return WithdrawalRequestResponse.builder()
                .id(wr.getId().toString())
                .amount(wr.getAmount())
                .paypalEmail(wr.getReceiverEmailSnapshot())
                .provider(wr.getProvider() != null ? wr.getProvider().name() : null)
                .status(wr.getStatus().name())
                .createdAt(wr.getCreatedAt())
                .completedAt(wr.getCompletedAt())
                .rejectionReason(wr.getRejectionReason())
                .build();
    }

    public static FeeSplitResult splitDeliveryFee(
            BigDecimal deliveryFee,
            BigDecimal platformFeeRate,
            BigDecimal agencyCommissionRate) {
        if (deliveryFee == null || deliveryFee.compareTo(BigDecimal.ZERO) <= 0) {
            return new FeeSplitResult(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }
        BigDecimal adminShare = deliveryFee.multiply(platformFeeRate)
                .setScale(SCALE, java.math.RoundingMode.HALF_UP);
        BigDecimal remainingFee = deliveryFee.subtract(adminShare);
        BigDecimal agencyShare = remainingFee.multiply(agencyCommissionRate)
                .setScale(SCALE, java.math.RoundingMode.HALF_UP);
        BigDecimal driverShare = remainingFee.subtract(agencyShare);
        return new FeeSplitResult(adminShare, agencyShare, driverShare, remainingFee);
    }

    public static BigDecimal calculatePlatformFee(BigDecimal amount, BigDecimal platformFeeRate) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        return amount.multiply(platformFeeRate).setScale(SCALE, java.math.RoundingMode.HALF_UP);
    }
}
