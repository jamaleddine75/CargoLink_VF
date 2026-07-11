package com.deliveryplatform.service;

import com.deliveryplatform.dto.response.PagedResponse;
import com.deliveryplatform.dto.request.FinanceSettingsUpdateRequest;
import com.deliveryplatform.dto.request.WalletAdjustmentRequest;
import com.deliveryplatform.dto.response.finance.FinanceSettingsDTO;
import com.deliveryplatform.dto.response.finance.TransactionDTO;
import com.deliveryplatform.dto.response.finance.WalletOverviewDTO;
import com.deliveryplatform.dto.response.finance.WithdrawalDTO;

import java.util.UUID;

public interface FinancialService {
    
    // Wallets
    PagedResponse<WalletOverviewDTO> getAllWallets(int page, int size, String walletType, String status, String search);
    void freezeWallet(UUID walletId, UUID adminId, String reason);
    void unfreezeWallet(UUID walletId, UUID adminId, String reason);
    TransactionDTO adjustWalletBalance(UUID walletId, WalletAdjustmentRequest request, UUID adminId);

    // Finance settings
    FinanceSettingsDTO getFinanceSettings();
    FinanceSettingsDTO updateFinanceSettings(FinanceSettingsUpdateRequest request, UUID adminId);
    
    // Transactions
    PagedResponse<TransactionDTO> getGlobalTransactions(int page, int size, String type, String status);
    
    // Withdrawals
    PagedResponse<WithdrawalDTO> getWithdrawalRequests(int page, int size, String status);
    void approveWithdrawal(UUID withdrawalId, UUID adminId);
    void rejectWithdrawal(UUID withdrawalId, UUID adminId, String reason);
}
