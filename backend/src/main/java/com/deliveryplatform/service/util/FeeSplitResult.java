package com.deliveryplatform.service.util;

import java.math.BigDecimal;

public record FeeSplitResult(
    BigDecimal adminShare,
    BigDecimal agencyShare,
    BigDecimal driverShare,
    BigDecimal remainingFee
) {}
