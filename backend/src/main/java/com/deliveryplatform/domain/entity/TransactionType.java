package com.deliveryplatform.domain.entity;

public enum TransactionType {
    GAIN,           // Delivery commission earned
    @Deprecated EARNING,        // Alternative name for delivery earnings -> use GAIN
    DEDUCTION,      // Amount deducted (penalty, etc.)
    COD_COLLECTED,  // Cash-on-delivery collected (for customer)
    COD_SETTLED,    // COD handed over to agency
    COD_REMIS,      // COD remittance transaction
    BONUS,          // Performance bonus
    PAYOUT,         // Withdrawal to bank account
    CREDIT,         // Generic credit
    @Deprecated DEBIT,          // Generic debit -> use DEDUCTION
    COMMISSION,     // Agency commission
    WITHDRAWAL,     // Agency/Customer withdrawal
    DELIVERY_PAYMENT, // Fee paid by customer for delivery
    REFUND,         // Refunded amount
    @Deprecated WITHDRAW,       // Specific withdrawal type -> use PAYOUT
    DEPOSIT,        // Funds added to wallet
    PLATFORM_REVENUE // Admin profit (5%)
}
