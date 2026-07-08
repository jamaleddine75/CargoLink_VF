package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.CustomerWalletResponse;
import com.deliveryplatform.dto.response.PagedResponse;
import com.deliveryplatform.dto.response.TransactionResponse;
import com.deliveryplatform.dto.response.WalletCreditResult;
import com.deliveryplatform.dto.response.WalletResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface WalletService {
    WalletResponse getDriverBalance(UUID userId);
    WalletResponse getWalletByUserId(java.util.UUID userId);
    PagedResponse<TransactionResponse> getTransactions(UUID userId, Integer page, Integer size, String type, String period, LocalDate startDate, LocalDate endDate);
    List<TransactionResponse> getPendingCOD(UUID userId);
    Map<String, Object> declareCODRemittance(UUID userId, List<UUID> orderIds, java.math.BigDecimal totalAmount);
    Map<String, Object> remitAllByAgencyScan(UUID driverUserId, UUID agencyId);
    Map<String, Object> getWeeklyCommission(UUID userId);
    Map<String, Object> getMonthlyEarnings(UUID userId);
    Map<String, Object> requestPayout(UUID userId, java.math.BigDecimal amount, UUID paymentAccountId);
    List<TransactionResponse> getBonuses(UUID userId);
    Map<String, Object> getWalletStats(UUID userId);
    void processTransaction(java.util.UUID userId, String type, java.math.BigDecimal amount, String description, java.util.UUID orderId);
    void addFunds(java.util.UUID userId, java.math.BigDecimal amount);
    void deductFunds(java.util.UUID userId, java.math.BigDecimal amount);
    void freezeAccount(java.util.UUID userId);
    void unfreezeAccount(java.util.UUID userId);
    
    /**
     * Process delivery payment and COD when order status changes to DELIVERED.
     * Splits delivery fee between driver and agency based on agency commission rate.
     * Also handles COD collection if applicable.
     *
     * @param orderId UUID of the order being delivered
     * @param codCollected Whether COD was collected at the time of delivery
     */
    void handleOrderDelivery(com.deliveryplatform.domain.entity.Order order, Boolean codCollected);
    
    // Phase 5: Driver Earnings Methods
    /**
     * Get total daily earnings for a driver
     */
    java.math.BigDecimal getDailyEarnings(UUID userId);
    
    /**
     * Get withdrawal requests for a driver
     */
    List<com.deliveryplatform.dto.response.WithdrawalRequestResponse> getWithdrawalRequests(UUID userId);
    
    /**
     * Get daily earnings breakdown for the past N days
     */
    List<com.deliveryplatform.dto.response.DailyEarningsResponse> getDailyEarningsBreakdown(UUID userId, Integer days);
    
    /**
     * Generate CSV statement of all transactions
     */
    String generateCSVStatement(UUID userId);
    
    /**
     * Create a new withdrawal request
     */
    com.deliveryplatform.dto.response.WithdrawalRequestResponse createWithdrawalRequest(UUID userId, java.math.BigDecimal amount, UUID paymentAccountId);

    com.deliveryplatform.dto.response.PagedResponse<?> getAllWallets(int page, int size);

    List<TransactionResponse> getPendingCODRemittances();
    List<TransactionResponse> getAllCODRemittances(String status);
    List<TransactionResponse> getDriverPendingCODRemittances(UUID userId);
    void rejectCODRemittance(UUID transactionId, String reason);
    void acceptCODRemittance(UUID transactionId);

    /**
     * Agency confirms receipt of COD money from driver.
     * Triggers settlement to clients after deducting platform commission.
     */
    Map<String, Object> confirmCODRemittance(UUID agencyId, UUID transactionId);

    /**
     * Process daily batch settlement for all confirmed COD remittances.
     */
    void reconcileDailyBatch();

    /**
     * Get statistics specifically for customer (sender) wallet.
     */
    CustomerWalletResponse getCustomerWalletStats(UUID userId);

    /**
     * Process delivery fee payment from customer wallet.
     */
    void handleCustomerOrderPayment(com.deliveryplatform.domain.entity.Order order);

    /**
     * Process COD collection for customer wallet when order is delivered.
     */
    void handleCustomerCodCollected(com.deliveryplatform.domain.entity.Order order);
    // Financial Admin & Agency Methods
    void approveWithdrawalRequest(UUID adminId, UUID withdrawalId);
    Map<String, Object> agencyRequestPayout(UUID agencyId, java.math.BigDecimal amount, UUID paymentAccountId);
    void adminApproveAgencyPayout(UUID adminId, UUID payoutRequestId);
    void addBonusToDriver(UUID driverId, java.math.BigDecimal amount, String reason);
    void applyDeduction(UUID driverId, java.math.BigDecimal amount, String reason);

    // Rejection & Listing Methods
    void rejectWithdrawalRequest(UUID adminId, UUID withdrawalId, String reason);
    List<com.deliveryplatform.dto.response.WithdrawalRequestResponse> getAllWithdrawalRequests(String status);
    List<com.deliveryplatform.domain.entity.AgencyPayoutRequest> getAllAgencyPayoutRequests(String status);
    List<com.deliveryplatform.domain.entity.AgencyPayoutRequest> getAllAgencyPayoutRequestsByAgency(UUID agencyId);
    void rejectAgencyPayout(UUID adminId, UUID payoutRequestId, String reason);
    
    // Agency Finance Methods
    com.deliveryplatform.domain.entity.AgencyWallet getAgencyWallet(UUID agencyId);
    List<TransactionResponse> getAgencyCommissions(UUID agencyId);
    List<TransactionResponse> getAgencyRemittances(UUID agencyId);
    
    // Earnings Summary
    Map<String, Object> getEarningsSummary(UUID userId);
    Map<String, Object> getFinanceSummary();

    // =========================================================================
    // DEV-ONLY — must never be called from production code paths.
    // Implemented only when the "dev" Spring profile is active.
    // =========================================================================

    /**
     * Credits a user's wallet with the given amount for testing purposes.
     * <p>
     * Acquires a pessimistic write lock on the wallet row, creates the wallet if
     * it does not exist, updates {@code Wallet.balance}, and persists a
     * {@code DEPOSIT / COMPLETED} transaction in the ledger — all inside one
     * database transaction.
     *
     * @param userId    UUID of the user to credit (must not be {@code null})
     * @param amount    Amount to credit (must be &gt; 0)
     * @param reason    Optional memo appended to the transaction description
     * @return          {@link WalletCreditResult} with the full before/after state
     * @throws com.deliveryplatform.exception.ResourceNotFoundException if user not found
     * @throws com.deliveryplatform.exception.BusinessException if wallet is frozen
     */
    WalletCreditResult creditWalletForTesting(UUID userId, java.math.BigDecimal amount, String reason);
}
