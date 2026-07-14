package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.FinancialAuditLog;
import com.deliveryplatform.domain.entity.Transaction;
import com.deliveryplatform.domain.entity.TransactionType;
import com.deliveryplatform.domain.entity.TransactionStatus;
import com.deliveryplatform.domain.entity.Wallet;
import com.deliveryplatform.domain.entity.WithdrawalRequest;
import com.deliveryplatform.dto.request.FinanceSettingsUpdateRequest;
import com.deliveryplatform.dto.request.WalletAdjustmentRequest;
import com.deliveryplatform.dto.response.PagedResponse;
import com.deliveryplatform.dto.response.finance.FinanceSettingsDTO;
import com.deliveryplatform.dto.response.finance.TransactionDTO;
import com.deliveryplatform.dto.response.finance.WalletOverviewDTO;
import com.deliveryplatform.dto.response.finance.WithdrawalDTO;
import com.deliveryplatform.exception.BusinessException;
import com.deliveryplatform.mapper.FinancialMapper;
import com.deliveryplatform.repository.FinancialAuditLogRepository;
import com.deliveryplatform.repository.TransactionRepository;
import com.deliveryplatform.repository.WalletRepository;
import com.deliveryplatform.repository.WithdrawalRequestRepository;
import com.deliveryplatform.service.FinancialService;
import com.deliveryplatform.service.PlatformFinanceSettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinancialServiceImpl implements FinancialService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final FinancialAuditLogRepository auditLogRepository;
    private final FinancialMapper financialMapper;
    private final PlatformFinanceSettingsService platformFinanceSettingsService;
    private final com.deliveryplatform.repository.AgencyWalletRepository agencyWalletRepository;
    private final com.deliveryplatform.repository.AgencyTransactionRepository agencyTransactionRepository;

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<WalletOverviewDTO> getAllWallets(int page, int size, String walletType, String status, String search) {
        List<WalletOverviewDTO> allWallets = new java.util.ArrayList<>();
        
        // 1. Fetch regular user wallets
        walletRepository.findAll().stream()
                .map(financialMapper::toWalletOverviewDTO)
                .forEach(allWallets::add);
                
        // 2. Fetch agency wallets
        agencyWalletRepository.findAll().stream()
                .map(financialMapper::toWalletOverviewDTO)
                .forEach(allWallets::add);

        // 3. Filter, Sort and Paginate
        List<WalletOverviewDTO> filteredWallets = allWallets.stream()
                .filter(dto -> matchesWalletType(dto, walletType))
                .filter(dto -> matchesStatus(dto, status))
                .filter(dto -> matchesSearch(dto, search))
                .sorted(Comparator.comparing(
                        (WalletOverviewDTO dto) -> dto.getOwnerName() != null ? dto.getOwnerName().toLowerCase() : ""
                ))
                .collect(Collectors.toList());

        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int fromIndex = Math.min(safePage * safeSize, filteredWallets.size());
        int toIndex = Math.min(fromIndex + safeSize, filteredWallets.size());
        List<WalletOverviewDTO> content = filteredWallets.subList(fromIndex, toIndex);
        int totalPages = filteredWallets.isEmpty() ? 0 : (int) Math.ceil((double) filteredWallets.size() / safeSize);

        return new PagedResponse<>(
                content,
                safePage,
                safeSize,
                safePage,
                safeSize,
                filteredWallets.size(),
                totalPages,
                toIndex >= filteredWallets.size()
        );
    }

    @Override
    @Transactional
    public void freezeWallet(UUID walletId, UUID adminId, String reason) {
        com.deliveryplatform.domain.entity.Wallet wallet = walletRepository.findById(walletId).orElse(null);
        if (wallet != null) {
            wallet.setFrozen(true);
            wallet.setFrozenReason(reason);
            walletRepository.save(wallet);
            logAudit(adminId, "FREEZE_WALLET", walletId.toString(), "WALLET", "ACTIVE", "FROZEN", reason);
        } else {
            com.deliveryplatform.domain.entity.AgencyWallet agencyWallet = agencyWalletRepository.findById(walletId)
                    .orElseThrow(() -> new RuntimeException("Wallet not found with ID: " + walletId));
            agencyWallet.setFrozen(true);
            agencyWallet.setFrozenReason(reason);
            agencyWalletRepository.save(agencyWallet);
            logAudit(adminId, "FREEZE_WALLET", walletId.toString(), "AGENCY_WALLET", "ACTIVE", "FROZEN", reason);
        }
    }

    @Override
    @Transactional
    public void unfreezeWallet(UUID walletId, UUID adminId, String reason) {
        com.deliveryplatform.domain.entity.Wallet wallet = walletRepository.findById(walletId).orElse(null);
        if (wallet != null) {
            wallet.setFrozen(false);
            wallet.setFrozenReason(null);
            walletRepository.save(wallet);
            logAudit(adminId, "UNFREEZE_WALLET", walletId.toString(), "WALLET", "FROZEN", "ACTIVE", reason);
        } else {
            com.deliveryplatform.domain.entity.AgencyWallet agencyWallet = agencyWalletRepository.findById(walletId)
                    .orElseThrow(() -> new RuntimeException("Wallet not found with ID: " + walletId));
            agencyWallet.setFrozen(false);
            agencyWallet.setFrozenReason(null);
            agencyWalletRepository.save(agencyWallet);
            logAudit(adminId, "UNFREEZE_WALLET", walletId.toString(), "AGENCY_WALLET", "FROZEN", "ACTIVE", reason);
        }
    }

    @Override
    @Transactional
    public TransactionDTO adjustWalletBalance(UUID walletId, WalletAdjustmentRequest request, UUID adminId) {
        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new BusinessException("Reason is required for manual wallet adjustments");
        }

        BigDecimal signedAmount = request.getDirection() == WalletAdjustmentRequest.Direction.DEBIT
                ? request.getAmount().negate()
                : request.getAmount();

        com.deliveryplatform.domain.entity.Wallet wallet = walletRepository.findById(walletId).orElse(null);
        if (wallet != null) {
            BigDecimal oldBalance = wallet.getBalance();
            wallet.setBalance(wallet.getBalance().add(signedAmount));
            walletRepository.save(wallet);

            Transaction tx = Transaction.builder()
                    .wallet(wallet)
                    .amount(signedAmount.abs())
                    .type(request.getDirection() == WalletAdjustmentRequest.Direction.DEBIT ? TransactionType.DEDUCTION : TransactionType.CREDIT)
                    .status(TransactionStatus.COMPLETED)
                    .description("Manual adjustment by admin (" + request.getDirection() + "): " + request.getReason())
                    .date(java.time.LocalDateTime.now())
                    .build();
            transactionRepository.save(tx);

            logAudit(adminId, "ADJUST_BALANCE", walletId.toString(), "WALLET", 
                    oldBalance.toString(), wallet.getBalance().toString(), request.getReason());

            return financialMapper.toTransactionDTO(tx);
        } else {
            com.deliveryplatform.domain.entity.AgencyWallet agencyWallet = agencyWalletRepository.findById(walletId)
                    .orElseThrow(() -> new RuntimeException("Wallet not found with ID: " + walletId));

            BigDecimal oldBalance = agencyWallet.getBalance();
            BigDecimal newBalance = oldBalance.add(signedAmount);
            agencyWallet.setBalance(newBalance);
            agencyWallet.setCurrentBalance(newBalance); // Keep current_balance in sync
            agencyWalletRepository.save(agencyWallet);

            com.deliveryplatform.domain.entity.AgencyTransaction agencyTx = com.deliveryplatform.domain.entity.AgencyTransaction.builder()
                    .agencyWallet(agencyWallet)
                    .amount(signedAmount.abs())
                    .type(request.getDirection() == WalletAdjustmentRequest.Direction.DEBIT ? TransactionType.DEDUCTION : TransactionType.CREDIT)
                    .status(TransactionStatus.COMPLETED)
                    .description("Manual adjustment by admin (" + request.getDirection() + "): " + request.getReason())
                    .date(java.time.LocalDateTime.now())
                    .build();
            agencyTransactionRepository.save(agencyTx);

            logAudit(adminId, "ADJUST_BALANCE", walletId.toString(), "AGENCY_WALLET", 
                    oldBalance.toString(), agencyWallet.getBalance().toString(), request.getReason());

            return financialMapper.toTransactionDTO(agencyTx);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public FinanceSettingsDTO getFinanceSettings() {
        return platformFinanceSettingsService.getCurrentSettingsDto();
    }

    @Override
    @Transactional
    public FinanceSettingsDTO updateFinanceSettings(FinanceSettingsUpdateRequest request, UUID adminId) {
        return platformFinanceSettingsService.updateSettings(request, adminId);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TransactionDTO> getGlobalTransactions(int page, int size, String type, String status) {
        Page<Transaction> txPage = transactionRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "date")));
        return new PagedResponse<TransactionDTO>(
                txPage.getContent().stream().map(financialMapper::toTransactionDTO).collect(Collectors.toList()),
                txPage.getNumber(),
                txPage.getSize(),
                txPage.getNumber(),
                txPage.getSize(),
                txPage.getTotalElements(),
                txPage.getTotalPages(),
                txPage.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<WithdrawalDTO> getWithdrawalRequests(int page, int size, String status) {
        Page<WithdrawalRequest> requests = withdrawalRequestRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new PagedResponse<WithdrawalDTO>(
                requests.getContent().stream().map(financialMapper::toWithdrawalDTO).collect(Collectors.toList()),
                requests.getNumber(),
                requests.getSize(),
                requests.getNumber(),
                requests.getSize(),
                requests.getTotalElements(),
                requests.getTotalPages(),
                requests.isLast()
        );
    }

    @Override
    @Transactional
    public void approveWithdrawal(UUID withdrawalId, UUID adminId) {
        WithdrawalRequest request = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        // Assume logic for processing the withdrawal actually succeeds
        request.setStatus(com.deliveryplatform.domain.entity.TransactionStatus.COMPLETED);
        withdrawalRequestRepository.save(request);
        
        logAudit(adminId, "APPROVE_WITHDRAWAL", withdrawalId.toString(), "WITHDRAWAL", 
                "PENDING", "APPROVED", "Approved via Financial Center");
    }

    @Override
    @Transactional
    public void rejectWithdrawal(UUID withdrawalId, UUID adminId, String reason) {
        WithdrawalRequest request = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        request.setStatus(com.deliveryplatform.domain.entity.TransactionStatus.REJECTED);
        withdrawalRequestRepository.save(request);
        
        // Refund logic would be called here via a wallet service, 
        // for simplicity we just update the status in this redesign phase
        
        logAudit(adminId, "REJECT_WITHDRAWAL", withdrawalId.toString(), "WITHDRAWAL", 
                "PENDING", "REJECTED", reason);
    }
    
    private void logAudit(UUID adminId, String action, String targetId, String targetType, 
                         String prev, String next, String reason) {
        FinancialAuditLog auditLog = FinancialAuditLog.builder()
                .adminId(adminId)
                .action(action)
                .targetId(targetId)
                .targetType(targetType)
                .previousValue(prev)
                .newValue(next)
                .reason(reason)
                .ipAddress("0.0.0.0") // Ideally extracted from RequestContextHolder
                .build();
        auditLogRepository.save(auditLog);
    }

    private boolean matchesWalletType(WalletOverviewDTO dto, String walletType) {
        if (walletType == null || walletType.isBlank()) {
            return true;
        }
        return walletType.equalsIgnoreCase(dto.getUserType());
    }

    private boolean matchesStatus(WalletOverviewDTO dto, String status) {
        if (status == null || status.isBlank()) {
            return true;
        }
        return status.equalsIgnoreCase(dto.getStatus());
    }

    private boolean matchesSearch(WalletOverviewDTO dto, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String needle = search.toLowerCase();
        return contains(dto.getOwnerName(), needle)
                || contains(dto.getOwnerEmail(), needle)
                || contains(dto.getOwnerPhone(), needle)
                || contains(dto.getAgencyName(), needle)
                || (dto.getWalletId() != null && dto.getWalletId().toString().toLowerCase().contains(needle));
    }

    private boolean contains(String value, String needle) {
        return value != null && value.toLowerCase().contains(needle);
    }
}
