package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.Transaction;
import com.deliveryplatform.domain.entity.Wallet;
import com.deliveryplatform.domain.entity.WithdrawalRequest;
import com.deliveryplatform.dto.response.finance.TransactionDTO;
import com.deliveryplatform.dto.response.finance.WalletOverviewDTO;
import com.deliveryplatform.dto.response.finance.WithdrawalDTO;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class FinancialMapper {

    public WalletOverviewDTO toWalletOverviewDTO(Wallet wallet) {
        if (wallet == null) return null;

        return WalletOverviewDTO.builder()
                .walletId(wallet.getId())
                .ownerId(wallet.getUser() != null ? wallet.getUser().getId() : null)
                .ownerName(wallet.getUser() != null ? wallet.getUser().getFirstName() + " " + wallet.getUser().getLastName() : "System")
                .ownerEmail(wallet.getUser() != null ? wallet.getUser().getEmail() : null)
                .ownerPhone(wallet.getUser() != null ? wallet.getUser().getPhoneNumber() : null)
                .userType(wallet.getWalletType() != null ? wallet.getWalletType().name() : "UNKNOWN")
                .agencyName(wallet.getUser() != null && wallet.getUser().getAgency() != null ? wallet.getUser().getAgency().getName() : null)
                .balance(wallet.getBalance())
                .availableBalance(wallet.getBalance()) // Depending on your logic, might subtract frozen
                .frozenBalance(wallet.isFrozen() ? wallet.getBalance() : BigDecimal.ZERO)
                .pendingBalance(BigDecimal.ZERO) // Aggregated separately if needed
                .cashInHand(wallet.getCashInHand())
                .debtToSystem(wallet.getDebtToSystem())
                .isFrozen(wallet.isFrozen())
                .status(wallet.isFrozen() ? "FROZEN" : "ACTIVE")
                .build();
    }

    public TransactionDTO toTransactionDTO(Transaction tx) {
        if (tx == null) return null;

        return TransactionDTO.builder()
                .id(tx.getId())
                .type(tx.getType() != null ? tx.getType().name() : "UNKNOWN")
                .amount(tx.getAmount())
                .status(tx.getStatus() != null ? tx.getStatus().name() : "UNKNOWN")
                .description(tx.getDescription())
                .walletId(tx.getWallet() != null ? tx.getWallet().getId() : null)
                .ownerName(tx.getWallet() != null && tx.getWallet().getUser() != null ? 
                           tx.getWallet().getUser().getFirstName() + " " + tx.getWallet().getUser().getLastName() : "Unknown")
                .createdAt(tx.getDate())
                .build();
    }

    public WithdrawalDTO toWithdrawalDTO(WithdrawalRequest wr) {
        if (wr == null) return null;

        return WithdrawalDTO.builder()
                .id(wr.getId())
                .userId(wr.getUser() != null ? wr.getUser().getId() : null)
                .userName(wr.getUser() != null ? wr.getUser().getFirstName() + " " + wr.getUser().getLastName() : "Unknown")
                .userRole(wr.getUser() != null && wr.getUser().getRole() != null ? wr.getUser().getRole().name() : "UNKNOWN")
                .amount(wr.getAmount())
                .method(wr.getProvider() != null ? wr.getProvider().name() : "UNKNOWN")
                .status(wr.getStatus() != null ? wr.getStatus().name() : "UNKNOWN")
                .requestedAt(wr.getCreatedAt())
                .processedAt(wr.getCompletedAt())
                .build();
    }
}
