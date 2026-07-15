package com.deliveryplatform.service.billing.impl;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.domain.entity.AgencyWallet;
import com.deliveryplatform.domain.entity.Driver;
import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.billing.*;
import com.deliveryplatform.dto.billing.*;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.repository.AgencyRepository;
import com.deliveryplatform.repository.AgencyWalletRepository;
import com.deliveryplatform.repository.DriverRepository;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.repository.billing.*;
import com.deliveryplatform.service.billing.AgencyBillingService;
import com.deliveryplatform.service.billing.InvoicingService;
import com.deliveryplatform.service.billing.LedgerService;
import com.deliveryplatform.service.PlatformFinanceSettingsService;
import com.deliveryplatform.service.util.WalletCalculationHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgencyBillingServiceImpl implements AgencyBillingService {

    private final AgencyRepository agencyRepository;
    private final AgencyWalletRepository walletRepository;
    private final AgencyCustomerPaymentRepository paymentRepository;
    private final DriverEarningRepository driverEarningRepository;
    private final DriverFinancialRecordRepository driverFinancialRepository;
    private final CODReconciliationRepository codRepository;
    private final PlatformCommissionRecordRepository platformCommissionRepository;
    private final AgencyLedgerTransactionRepository ledgerRepository;
    
    private final LedgerService ledgerService;
    private final InvoicingService invoicingService;
    private final DriverRepository driverRepository;
    private final OrderRepository orderRepository;
    private final PlatformFinanceSettingsService platformFinanceSettingsService;

    @Override
    public BillingSummaryResponse getBillingSummary(UUID agencyId) {
        AgencyWallet wallet = walletRepository.findByAgencyId(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("AgencyWallet", "agencyId", agencyId));

        return BillingSummaryResponse.builder()
                .totalRevenue(wallet.getTotalRevenue())
                .totalExpenses(wallet.getTotalExpenses())
                .netProfit(wallet.getTotalProfit())
                .pendingReceivables(wallet.getPendingReceivables())
                .pendingPayables(wallet.getPendingPayables())
                .currentWalletBalance(wallet.getCurrentBalance())
                .build();
    }

    @Override
    public AgencyWallet getWallet(UUID agencyId) {
        return walletRepository.findByAgencyId(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("AgencyWallet", "agencyId", agencyId));
    }

    @Override
    @Transactional
    public AgencyCustomerPayment recordCustomerPayment(UUID agencyId, UUID invoiceId, PaymentRequest request) {
        AgencyCustomerInvoice invoice = invoicingService.getInvoice(agencyId, invoiceId);
        
        AgencyCustomerPayment payment = AgencyCustomerPayment.builder()
                .invoice(invoice)
                .agency(invoice.getAgency())
                .customer(invoice.getCustomer())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .reference(request.getReference())
                .status(BillingPaymentStatus.SUCCESS)
                .paidAt(LocalDateTime.now())
                .build();

        payment = paymentRepository.save(payment);

        // Update Invoice
        invoice.setAmountPaid(invoice.getAmountPaid().add(request.getAmount()));
        invoice.setAmountDue(invoice.getTotalAmount().subtract(invoice.getAmountPaid()));
        invoicingService.updateInvoiceStatus(invoiceId);

        // Update Wallet & Ledger
        ledgerService.recordTransaction(
                agencyId,
                LedgerTransactionType.CUSTOMER_PAYMENT,
                "INVOICE",
                invoiceId,
                "Payment received for invoice " + invoice.getInvoiceNumber(),
                BigDecimal.ZERO,
                request.getAmount()
        );

        // Update pending receivables in wallet
        AgencyWallet wallet = walletRepository.findByAgencyId(agencyId).orElseThrow();
        wallet.setPendingReceivables(wallet.getPendingReceivables().subtract(request.getAmount()));
        walletRepository.save(wallet);

        return payment;
    }

    @Override
    public Page<AgencyCustomerPayment> getPayments(UUID agencyId, Pageable pageable) {
        return paymentRepository.findAll((root, query, cb) -> cb.equal(root.get("agency").get("id"), agencyId), pageable);
    }

    @Override
    @Transactional
    public DriverEarning createDriverEarning(UUID agencyId, UUID driverId, UUID orderId, BigDecimal base, BigDecimal commission, BigDecimal bonus, BigDecimal penalty) {
        Agency agency = agencyRepository.findById(agencyId).orElseThrow();
        Driver driver = driverRepository.findById(driverId).orElseThrow();
        Order order = orderId != null ? orderRepository.findById(orderId).orElse(null) : null;

        BigDecimal netAmount = base.add(commission).add(bonus).subtract(penalty);

        DriverEarning earning = DriverEarning.builder()
                .agency(agency)
                .driver(driver)
                .order(order)
                .baseAmount(base)
                .commissionAmount(commission)
                .bonusAmount(bonus)
                .penaltyAmount(penalty)
                .netAmount(netAmount)
                .status(DriverEarningStatus.PENDING)
                .build();

        earning = driverEarningRepository.save(earning);

        // Update Driver Financial Record
        DriverFinancialRecord record = driverFinancialRepository.findByAgencyIdAndDriverId(agencyId, driverId)
                .orElseGet(() -> driverFinancialRepository.save(DriverFinancialRecord.builder()
                        .agency(agency).driver(driver).build()));

        record.setTotalEarnings(record.getTotalEarnings().add(netAmount));
        record.setTotalBonuses(record.getTotalBonuses().add(bonus));
        record.setTotalPenalties(record.getTotalPenalties().add(penalty));
        record.setOutstandingBalance(record.getOutstandingBalance().add(netAmount));
        driverFinancialRepository.save(record);

        // Update Agency Wallet Pending Payables
        AgencyWallet wallet = walletRepository.findByAgencyId(agencyId).orElseThrow();
        wallet.setPendingPayables(wallet.getPendingPayables().add(netAmount));
        walletRepository.save(wallet);

        return earning;
    }

    @Override
    @Transactional
    public void payDriverEarning(UUID agencyId, UUID earningId) {
        DriverEarning earning = driverEarningRepository.findById(earningId)
                .filter(e -> e.getAgency().getId().equals(agencyId))
                .orElseThrow(() -> new ResourceNotFoundException("DriverEarning", "id", earningId));

        if (earning.getStatus() == DriverEarningStatus.PAID) {
            throw new IllegalStateException("Earning already paid");
        }

        earning.setStatus(DriverEarningStatus.PAID);
        driverEarningRepository.save(earning);

        // Record Ledger Transaction (Debit)
        ledgerService.recordTransaction(
                agencyId,
                LedgerTransactionType.DRIVER_EARNING,
                "DRIVER_EARNING",
                earningId,
                "Payout to driver " + earning.getDriver().getId(),
                earning.getNetAmount(),
                BigDecimal.ZERO
        );

        // Update Driver Financial Record
        DriverFinancialRecord record = driverFinancialRepository.findByAgencyIdAndDriverId(agencyId, earning.getDriver().getId()).orElseThrow();
        record.setTotalPaid(record.getTotalPaid().add(earning.getNetAmount()));
        record.setOutstandingBalance(record.getOutstandingBalance().subtract(earning.getNetAmount()));
        driverFinancialRepository.save(record);

        // Update Agency Wallet Pending Payables
        AgencyWallet wallet = walletRepository.findByAgencyId(agencyId).orElseThrow();
        wallet.setPendingPayables(wallet.getPendingPayables().subtract(earning.getNetAmount()));
        walletRepository.save(wallet);
    }

    @Override
    public Page<DriverEarning> getDriverEarnings(UUID agencyId, Pageable pageable) {
        return driverEarningRepository.findAll((root, query, cb) -> cb.equal(root.get("agency").get("id"), agencyId), pageable);
    }

    @Override
    @Transactional
    public CODReconciliation reconcileCOD(UUID agencyId, UUID orderId, UUID driverId, BigDecimal expected, BigDecimal received, String notes) {
        Agency agency = agencyRepository.findById(agencyId).orElseThrow();
        Driver driver = driverRepository.findById(driverId).orElseThrow();
        Order order = orderRepository.findById(orderId).orElseThrow();

        BigDecimal difference = received.subtract(expected);
        CODStatus status = difference.compareTo(BigDecimal.ZERO) == 0 ? CODStatus.MATCHED : CODStatus.MISMATCHED;

        CODReconciliation reconciliation = CODReconciliation.builder()
                .agency(agency)
                .order(order)
                .driver(driver)
                .expectedAmount(expected)
                .receivedAmount(received)
                .differenceAmount(difference)
                .status(status)
                .notes(notes)
                .build();

        reconciliation = codRepository.save(reconciliation);

        if (status == CODStatus.MATCHED || status == CODStatus.CONFIRMED) {
            // Record COD receipt in ledger
            ledgerService.recordTransaction(
                    agencyId,
                    LedgerTransactionType.COD_RECEIPT,
                    "ORDER",
                    orderId,
                    "COD Reconciliation for Order " + order.getTrackingNumber(),
                    BigDecimal.ZERO,
                    received
            );
        }

        return reconciliation;
    }

    @Override
    public Page<CODReconciliation> getCODReconciliations(UUID agencyId, Pageable pageable) {
        return codRepository.findAll((root, query, cb) -> cb.equal(root.get("agency").get("id"), agencyId), pageable);
    }

    @Override
    public CODReconciliation getCODReconciliation(UUID agencyId, UUID id) {
        return codRepository.findById(id)
                .filter(r -> r.getAgency().getId().equals(agencyId))
                .orElseThrow(() -> new ResourceNotFoundException("CODReconciliation", "id", id));
    }

    @Override
    @Transactional
    public PlatformCommissionRecord calculatePlatformCommission(UUID agencyId, UUID orderId, BigDecimal grossAmount) {
        Agency agency = agencyRepository.findById(agencyId).orElseThrow();
        Order order = orderRepository.findById(orderId).orElseThrow();

        BigDecimal feeAmount = WalletCalculationHelper.calculatePlatformFee(grossAmount, platformFinanceSettingsService.getPlatformFeeRate());

        PlatformCommissionRecord record = PlatformCommissionRecord.builder()
                .agency(agency)
                .order(order)
                .grossAmount(grossAmount)
                .platformFeeAmount(feeAmount)
                .status(PlatformCommissionStatus.CALCULATED)
                .build();

        record = platformCommissionRepository.save(record);

        // Record in Ledger (Debit)
        ledgerService.recordTransaction(
                agencyId,
                LedgerTransactionType.PLATFORM_FEE,
                "ORDER",
                orderId,
                "Platform commission for order " + order.getTrackingNumber(),
                feeAmount,
                BigDecimal.ZERO
        );

        return record;
    }

    @Override
    public Page<PlatformCommissionRecord> getPlatformCommissions(UUID agencyId, Pageable pageable) {
        return platformCommissionRepository.findAll((root, query, cb) -> cb.equal(root.get("agency").get("id"), agencyId), pageable);
    }

    @Override
    public Page<AgencyLedgerTransaction> getLedger(UUID agencyId, Pageable pageable) {
        return ledgerRepository.findByAgencyIdOrderByCreatedAtDesc(agencyId, pageable);
    }

    @Override
    @Transactional
    public void recordAdjustment(UUID agencyId, BigDecimal amount, String description, boolean isCredit) {
        ledgerService.recordTransaction(
                agencyId,
                isCredit ? LedgerTransactionType.ADJUSTMENT : LedgerTransactionType.ADJUSTMENT,
                null,
                null,
                description,
                isCredit ? BigDecimal.ZERO : amount,
                isCredit ? amount : BigDecimal.ZERO
        );
    }
}
