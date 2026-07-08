import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, WalletOverviewDTO } from '../../api/financialService';
import { 
  Search, 
  Filter, 
  Lock, 
  Unlock, 
  Edit3, 
  History, 
  MoreVertical,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

export const UnifiedWalletTable = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['financialWallets', page, size],
    queryFn: () => financialService.getWallets(page, size)
  });

  const freezeMutation = useMutation({
    mutationFn: (id: string) => financialService.freezeWallet(id, "Administrative action"),
    onSuccess: () => {
      toast.success('Wallet frozen successfully');
      queryClient.invalidateQueries({ queryKey: ['financialWallets'] });
    },
    onError: () => toast.error('Failed to freeze wallet')
  });

  const unfreezeMutation = useMutation({
    mutationFn: (id: string) => financialService.unfreezeWallet(id, "Administrative action"),
    onSuccess: () => {
      toast.success('Wallet unfrozen successfully');
      queryClient.invalidateQueries({ queryKey: ['financialWallets'] });
    },
    onError: () => toast.error('Failed to unfreeze wallet')
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MAD' }).format(amount || 0);
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      AGENCY: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      DRIVER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      CUSTOMER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      PLATFORM: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return styles[role] || styles['PLATFORM'];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by owner, ID, or agency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-right">Balance</th>
              <th className="px-6 py-4 text-right">Frozen Balance</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading wallets...</td>
              </tr>
            ) : data?.content?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No wallets found</td>
              </tr>
            ) : (
              data?.content?.map((wallet: WalletOverviewDTO) => (
                <tr key={wallet.walletId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{wallet.ownerName}</div>
                    <div className="text-xs text-gray-500 truncate w-32" title={wallet.walletId}>{wallet.walletId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadge(wallet.userType)}`}>
                      {wallet.userType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                    {formatCurrency(wallet.balance)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">
                    {formatCurrency(wallet.frozenBalance)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      wallet.status === 'ACTIVE' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {wallet.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        title="View Transactions"
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button 
                        title="Adjust Balance"
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {wallet.status === 'ACTIVE' ? (
                        <button 
                          title="Freeze Wallet"
                          onClick={() => freezeMutation.mutate(wallet.walletId)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          title="Unfreeze Wallet"
                          onClick={() => unfreezeMutation.mutate(wallet.walletId)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination (Simplified for UI completion) */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          Showing <span className="font-medium text-gray-900 dark:text-white">{data?.content?.length || 0}</span> wallets
        </span>
        <div className="flex space-x-2">
          <button 
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 text-gray-700 dark:text-gray-300"
          >
            Previous
          </button>
          <button 
            disabled={data?.last}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 text-gray-700 dark:text-gray-300"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
