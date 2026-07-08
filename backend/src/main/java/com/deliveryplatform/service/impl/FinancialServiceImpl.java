package com.deliveryplatform.service.impl;

import com.deliveryplatform.domain.entity.FinancialAuditLog;
import com.deliveryplatform.domain.entity.Transaction;
import com.deliveryplatform.domain.entity.TransactionType;
import com.deliveryplatform.domain.entity.TransactionStatus;
import com.deliveryplatform.domain.entity.Wallet;
import com.deliveryplatform.domain.entity.WithdrawalRequest;
import com.deliveryplatform.dto.response.PagedResponse;
import com.deliveryplatform.dto.response.finance.TransactionDTO;
import com.deliveryplatform.dto.response.finance.WalletOverviewDTO;
import com.deliveryplatform.dto.response.finance.WithdrawalDTO;
import com.deliveryplatform.mapper.FinancialMapper;
import com.deliveryplatform.repository.FinancialAuditLogRepository;
import com.deliveryplatform.repository.TransactionRepository;
import com.deliveryplatform.repository.WalletRepository;
import com.deliveryplatform.repository.WithdrawalRequestRepository;
import com.deliveryplatform.service.FinancialService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<WalletOverviewDTO> getAllWallets(int page, int size) {
        Page<Wallet> wallets = walletRepository.findAll(PageRequest.of(page, size));
        return new PagedResponse<>(
                wallets.getContent().stream().map(financialMapper::toWalletOverviewDTO).collect(Collectors.toList()),
                wallets.getNumber(),
                wallets.getSize(),
                wallets.getTotalElements(),
                wallets.getTotalPages(),
                wallets.isLast()
        );
    }

    @Override
    @Transactional
    public void freezeWallet(UUID walletId, UUID adminId, String reason) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        
        wallet.setFrozen(true);
        walletRepository.save(wallet);
        
        logAudit(adminId, "FREEZE_WALLET", walletId.toString(), "WALLET", "ACTIVE", "FROZEN", reason);
    }

    @Override
    @Transactional
    public void unfreezeWallet(UUID walletId, UUID adminId, String reason) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        
        wallet.setFrozen(false);
        walletRepository.save(wallet);
        
        logAudit(adminId, "UNFREEZE_WALLET", walletId.toString(), "WALLET", "FROZEN", "ACTIVE", reason);
    }

    @Override
    @Transactional
    public TransactionDTO adjustWalletBalance(UUID walletId, BigDecimal amount, String reason, UUID adminId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
                
        BigDecimal oldBalance = wallet.getBalance();
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);
        
        Transaction tx = Transaction.builder()
                .wallet(wallet)
                .amount(amount)
                .type(TransactionType.MANUAL_ADJUSTMENT)
                .status(TransactionStatus.COMPLETED)
                .description("Manual adjustment by admin: " + reason)
                .build();
        transactionRepository.save(tx);
        
        logAudit(adminId, "ADJUST_BALANCE", walletId.toString(), "WALLET", 
                oldBalance.toString(), wallet.getBalance().toString(), reason);
                
        return financialMapper.toTransactionDTO(tx);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TransactionDTO> getGlobalTransactions(int page, int size, String type, String status) {
        Page<Transaction> txPage = transactionRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new PagedResponse<>(
                txPage.getContent().stream().map(financialMapper::toTransactionDTO).collect(Collectors.toList()),
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
        return new PagedResponse<>(
                requests.getContent().stream().map(financialMapper::toWithdrawalDTO).collect(Collectors.toList()),
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
        request.setStatus(com.deliveryplatform.domain.entity.WithdrawalStatus.APPROVED);
        withdrawalRequestRepository.save(request);
        
        logAudit(adminId, "APPROVE_WITHDRAWAL", withdrawalId.toString(), "WITHDRAWAL", 
                "PENDING", "APPROVED", "Approved via Financial Center");
    }

    @Override
    @Transactional
    public void rejectWithdrawal(UUID withdrawalId, UUID adminId, String reason) {
        WithdrawalRequest request = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        request.setStatus(com.deliveryplatform.domain.entity.WithdrawalStatus.REJECTED);
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
}
