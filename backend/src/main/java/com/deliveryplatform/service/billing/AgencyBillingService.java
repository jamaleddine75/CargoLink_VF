package com.deliveryplatform.service.billing;

import com.deliveryplatform.domain.entity.billing.*;
import com.deliveryplatform.dto.billing.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.UUID;

public interface AgencyBillingService {
    // Summary & Wallet
    BillingSummaryResponse getBillingSummary(UUID agencyId);
    com.deliveryplatform.domain.entity.AgencyWallet getWallet(UUID agencyId);
    
    // Payments
    AgencyCustomerPayment recordCustomerPayment(UUID agencyId, UUID invoiceId, PaymentRequest request);
    Page<AgencyCustomerPayment> getPayments(UUID agencyId, Pageable pageable);
    
    // Driver Earnings
    DriverEarning createDriverEarning(UUID agencyId, UUID driverId, UUID orderId, BigDecimal base, BigDecimal commission, BigDecimal bonus, BigDecimal penalty);
    void payDriverEarning(UUID agencyId, UUID earningId);
    Page<DriverEarning> getDriverEarnings(UUID agencyId, Pageable pageable);
    
    // COD Reconciliation
    CODReconciliation reconcileCOD(UUID agencyId, UUID orderId, UUID driverId, BigDecimal expected, BigDecimal received, String notes);
    Page<CODReconciliation> getCODReconciliations(UUID agencyId, Pageable pageable);
    CODReconciliation getCODReconciliation(UUID agencyId, UUID id);
    
    // Platform Commission
    PlatformCommissionRecord calculatePlatformCommission(UUID agencyId, UUID orderId, BigDecimal grossAmount);
    Page<PlatformCommissionRecord> getPlatformCommissions(UUID agencyId, Pageable pageable);
    
    // Misc
    Page<AgencyLedgerTransaction> getLedger(UUID agencyId, Pageable pageable);
    void recordAdjustment(UUID agencyId, BigDecimal amount, String description, boolean isCredit);
}
