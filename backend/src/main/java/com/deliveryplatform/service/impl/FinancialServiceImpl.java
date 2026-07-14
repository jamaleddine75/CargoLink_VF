package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.FinancialAuditLog;
import com.deliveryplatform.domain.entity.AgencyTransaction;
import com.deliveryplatform.domain.entity.AgencyWallet;
import com.deliveryplatform.domain.entity.Transaction;
import com.deliveryplatform.domain.entity.TransactionStatus;
import com.deliveryplatform.domain.entity.TransactionType;
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
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.mapper.FinancialMapper;
import com.deliveryplatform.repository.AgencyTransactionRepository;
import com.deliveryplatform.repository.AgencyWalletRepository;
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
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinancialServiceImpl implements FinancialService {

    private final WalletRepository walletRepository;
    private final AgencyWalletRepository agencyWalletRepository;
    private final TransactionRepository transactionRepository;
    private final AgencyTransactionRepository agencyTransactionRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final FinancialAuditLogRepository auditLogRepository;
    private final FinancialMapper financialMapper;
    private final PlatformFinanceSettingsService platformFinanceSettingsService;
    private final com.deliveryplatform.service.WalletService walletService;

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<WalletOverviewDTO> getAllWallets(int page, int size, String walletType, String status, String search) {
        List<WalletOverviewDTO> allWallets = Stream.concat(
                        walletRepository.findAll().stream().map(financialMapper::toWalletOverviewDTO),
                        agencyWalletRepository.findAll().stream().map(financialMapper::toWalletOverviewDTO)
                )
                .filter(dto -> matchesWalletType(dto, walletType))
                .filter(dto -> matchesStatus(dto, status))
                .filter(dto -> matchesSearch(dto, search))
                .sorted(Comparator.comparing(
                        (WalletOverviewDTO dto) -> dto.getOwnerName() != null ? dto.getOwnerName().toLowerCase() : ""
                ))
                .collect(Collectors.toList());

        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int fromIndex = Math.min(safePage * safeSize, allWallets.size());
        int toIndex = Math.min(fromIndex + safeSize, allWallets.size());
        List<WalletOverviewDTO> content = allWallets.subList(fromIndex, toIndex);
        int totalPages = allWallets.isEmpty() ? 0 : (int) Math.ceil((double) allWallets.size() / safeSize);

        return new PagedResponse<>(
                content,
                safePage,
                safeSize,
                safePage,
                safeSize,
                allWallets.size(),
                totalPages,
                toIndex >= allWallets.size()
        );
    }

    @Override
    @Transactional
    public void freezeWallet(String walletId, UUID adminId, String reason) {
        if (isAgencyWalletReference(walletId)) {
            AgencyWallet agencyWallet = findAgencyWallet(walletId);
            agencyWallet.setFrozen(true);
            agencyWalletRepository.save(agencyWallet);
            logAudit(adminId, "FREEZE_WALLET", walletId, "AGENCY_WALLET", "ACTIVE", "FROZEN", reason);
        } else {
            Wallet wallet = findWallet(walletId);
            wallet.setFrozen(true);
            walletRepository.save(wallet);
            logAudit(adminId, "FREEZE_WALLET", walletId, "WALLET", "ACTIVE", "FROZEN", reason);
        }
    }

    @Override
    @Transactional
    public void unfreezeWallet(String walletId, UUID adminId, String reason) {
        if (isAgencyWalletReference(walletId)) {
            AgencyWallet agencyWallet = findAgencyWallet(walletId);
            agencyWallet.setFrozen(false);
            agencyWalletRepository.save(agencyWallet);
            logAudit(adminId, "UNFREEZE_WALLET", walletId, "AGENCY_WALLET", "FROZEN", "ACTIVE", reason);
        } else {
            Wallet wallet = findWallet(walletId);
            wallet.setFrozen(false);
            walletRepository.save(wallet);
            logAudit(adminId, "UNFREEZE_WALLET", walletId, "WALLET", "FROZEN", "ACTIVE", reason);
        }
    }

    @Override
    @Transactional
    public TransactionDTO adjustWalletBalance(String walletId, WalletAdjustmentRequest request, UUID adminId) {
        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new BusinessException("Reason is required for manual wallet adjustments");
        }

        BigDecimal signedAmount = request.getDirection() == WalletAdjustmentRequest.Direction.DEBIT
                ? request.getAmount().negate()
                : request.getAmount();

        if (isAgencyWalletReference(walletId)) {
            AgencyWallet wallet = findAgencyWallet(walletId);
            BigDecimal oldBalance = wallet.getBalance();
            BigDecimal newBalance = oldBalance.add(signedAmount);
            wallet.setBalance(newBalance);
            wallet.setCurrentBalance(newBalance);
            agencyWalletRepository.save(wallet);

            AgencyTransaction agencyTx = AgencyTransaction.builder()
                    .agencyWallet(wallet)
                    .amount(signedAmount.abs())
                    .type(request.getDirection() == WalletAdjustmentRequest.Direction.DEBIT ? TransactionType.DEDUCTION : TransactionType.CREDIT)
                    .status(TransactionStatus.COMPLETED)
                    .description("Manual adjustment by admin (" + request.getDirection() + "): " + request.getReason())
                    .date(java.time.LocalDateTime.now())
                    .build();
            agencyTransactionRepository.save(agencyTx);

            logAudit(adminId, "ADJUST_BALANCE", walletId, "AGENCY_WALLET",
                    oldBalance.toString(), wallet.getBalance().toString(), request.getReason());

            return financialMapper.toTransactionDTO(agencyTx);
        }

        Wallet wallet = findWallet(walletId);
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

        logAudit(adminId, "ADJUST_BALANCE", walletId, "WALLET",
                oldBalance.toString(), wallet.getBalance().toString(), request.getReason());

        return financialMapper.toTransactionDTO(tx);
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
        List<TransactionDTO> allTransactions = Stream.concat(
                        transactionRepository.findAll().stream().map(financialMapper::toTransactionDTO),
                        agencyTransactionRepository.findAll().stream().map(financialMapper::toTransactionDTO)
                )
                .filter(dto -> matchesTransactionType(dto, type))
                .filter(dto -> matchesTransactionStatus(dto, status))
                .sorted(Comparator.comparing(TransactionDTO::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .collect(Collectors.toList());

        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int fromIndex = Math.min(safePage * safeSize, allTransactions.size());
        int toIndex = Math.min(fromIndex + safeSize, allTransactions.size());
        List<TransactionDTO> content = allTransactions.subList(fromIndex, toIndex);
        int totalPages = allTransactions.isEmpty() ? 0 : (int) Math.ceil((double) allTransactions.size() / safeSize);

        return new PagedResponse<>(
                content,
                safePage,
                safeSize,
                safePage,
                safeSize,
                allTransactions.size(),
                totalPages,
                toIndex >= allTransactions.size()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<WithdrawalDTO> getWithdrawalRequests(int page, int size, String status) {
        Page<WithdrawalRequest> requests;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (status != null && !status.equalsIgnoreCase("ALL")) {
            requests = withdrawalRequestRepository.findByStatus(
                    TransactionStatus.valueOf(status.toUpperCase()), pageable);
        } else {
            requests = withdrawalRequestRepository.findAll(pageable);
        }
        return new PagedResponse<>(
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
        WithdrawalRequest wr = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new ResourceNotFoundException("WithdrawalRequest", "id", withdrawalId));
        wr.setStatus(TransactionStatus.APPROVED);
        wr.setCompletedAt(java.time.LocalDateTime.now());
        withdrawalRequestRepository.save(wr);

        logAudit(adminId, "APPROVE_WITHDRAWAL", withdrawalId.toString(), "WITHDRAWAL",
                "PENDING", "APPROVED", null);
    }

    @Override
    @Transactional
    public void rejectWithdrawal(UUID withdrawalId, UUID adminId, String reason) {
        walletService.rejectWithdrawalRequest(adminId, withdrawalId, reason);

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
                .ipAddress("0.0.0.0")
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
                || (dto.getWalletId() != null && dto.getWalletId().toLowerCase().contains(needle));
    }

    private boolean contains(String value, String needle) {
        return value != null && value.toLowerCase().contains(needle);
    }

    private boolean matchesTransactionType(TransactionDTO dto, String type) {
        if (type == null || type.isBlank()) {
            return true;
        }
        return dto.getType() != null && dto.getType().equalsIgnoreCase(type);
    }

    private boolean matchesTransactionStatus(TransactionDTO dto, String status) {
        if (status == null || status.isBlank()) {
            return true;
        }
        return dto.getStatus() != null && dto.getStatus().equalsIgnoreCase(status);
    }

    private boolean isAgencyWalletReference(String walletReference) {
        return walletReference != null && walletReference.regionMatches(true, 0, "AGENCY:", 0, 7);
    }

    private UUID parseWalletId(String walletReference) {
        String rawValue = walletReference;
        if (rawValue == null || rawValue.isBlank()) {
            throw new RuntimeException("Wallet reference is required");
        }
        int separatorIndex = rawValue.indexOf(':');
        if (separatorIndex >= 0) {
            rawValue = rawValue.substring(separatorIndex + 1);
        }
        try {
            return UUID.fromString(rawValue);
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid wallet reference: " + walletReference, ex);
        }
    }

    private Wallet findWallet(String walletReference) {
        UUID walletId = parseWalletId(walletReference);
        return walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
    }

    private AgencyWallet findAgencyWallet(String walletReference) {
        UUID walletId = parseWalletId(walletReference);
        return agencyWalletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Agency wallet not found"));
    }
}
    
