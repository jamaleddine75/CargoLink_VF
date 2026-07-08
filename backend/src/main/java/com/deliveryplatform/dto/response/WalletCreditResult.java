package com.deliveryplatform.dto.response;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Immutable result returned by {@link com.deliveryplatform.service.WalletService#creditWalletForTesting}.
 * <p>
 * This DTO is used exclusively by the development-only wallet credit flow. It is
 * intentionally kept separate from the production wallet response types so that
 * its shape can evolve without affecting any production API contract.
 */
@Value
@Builder
public class WalletCreditResult {

    /** UUID of the user whose wallet was credited. */
    UUID userId;

    /** Email address of the user. */
    String email;

    /** Role of the user (e.g. CUSTOMER, DRIVER). */
    String role;

    /** UUID of the wallet that was modified. */
    UUID walletId;

    /** Wallet classification (CUSTOMER, DRIVER, AGENCY, PLATFORM). */
    String walletType;

    /** Balance before the credit was applied. */
    BigDecimal previousBalance;

    /** Amount that was credited. */
    BigDecimal creditedAmount;

    /** Balance after the credit was applied. */
    BigDecimal newBalance;

    /** UUID of the DEPOSIT transaction created in the ledger. */
    UUID transactionId;

    /** Timestamp at which the credit transaction was recorded. */
    LocalDateTime timestamp;
}
