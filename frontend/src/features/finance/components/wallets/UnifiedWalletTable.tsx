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
      AGENCY: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
      DRIVER: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
      CUSTOMER: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20',
      PLATFORM: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20'
    };
    return styles[role] || styles['PLATFORM'];
  };

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const adjustMutation = useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason: string }) => 
      financialService.adjustWalletBalance(id, amount, reason),
    onSuccess: () => {
      toast.success('Wallet balance adjusted successfully');
      queryClient.invalidateQueries({ queryKey: ['financialWallets'] });
      setIsAdjustModalOpen(false);
      setAdjustAmount('');
      setAdjustReason('');
    },
    onError: () => toast.error('Failed to adjust balance')
  });

  const handleAdjustClick = (walletId: string) => {
    setSelectedWalletId(walletId);
    setIsAdjustModalOpen(true);
  };

  const submitAdjust = () => {
    if (!selectedWalletId || !adjustAmount || !adjustReason) return toast.error('Amount and reason are required');
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount)) return toast.error('Invalid amount');
    adjustMutation.mutate({ id: selectedWalletId, amount, reason: adjustReason });
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden relative">
      {isAdjustModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm rounded-3xl">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Adjust Balance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (MAD)</label>
                <input 
                  type="number" 
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 500 or -500"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                <input 
                  type="text" 
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Reason for adjustment"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={submitAdjust}
                disabled={adjustMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {adjustMutation.isPending ? 'Adjusting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/30 dark:bg-gray-800/30">
        <div className="relative max-w-md w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by owner, ID, or agency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 border border-gray-200/70 dark:border-gray-600/50 rounded-2xl bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-5 py-2.5 border border-gray-200/70 dark:border-gray-600/50 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500 transition-all shadow-sm">
            <Filter className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Filters</span>
          </button>
          <button className="flex items-center px-5 py-2.5 border border-gray-200/70 dark:border-gray-600/50 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500 transition-all shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50/50 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-5">Owner Identity</th>
              <th className="px-6 py-5">Entity Role</th>
              <th className="px-6 py-5 text-right">Available Balance</th>
              <th className="px-6 py-5 text-right">Frozen Balance</th>
              <th className="px-6 py-5 text-center">Wallet Status</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-sm font-medium animate-pulse">Loading wallet ecosystem...</span>
                  </div>
                </td>
              </tr>
            ) : data?.content?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No wallets found</td>
              </tr>
            ) : (
              data?.content?.map((wallet: WalletOverviewDTO) => (
                <tr key={wallet.walletId} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm shadow-inner">
                        {wallet.ownerName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{wallet.ownerName}</div>
                        <div className="text-xs text-gray-400 truncate w-32 font-mono mt-0.5" title={wallet.walletId}>{wallet.walletId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${getRoleBadge(wallet.userType)}`}>
                      {wallet.userType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-gray-900 dark:text-white text-base">
                      {formatCurrency(wallet.balance)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-medium text-gray-500 dark:text-gray-400">
                      {formatCurrency(wallet.frozenBalance)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                      wallet.status === 'ACTIVE' 
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${wallet.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                      {wallet.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        title="View Transactions"
                        onClick={() => toast('Navigate to the Transactions tab to see full history', { icon: 'ℹ️' })}
                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-xl transition-colors border border-indigo-100 dark:border-indigo-800/50"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button 
                        title="Adjust Balance"
                        onClick={() => handleAdjustClick(wallet.walletId)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-xl transition-colors border border-blue-100 dark:border-blue-800/50"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {wallet.status === 'ACTIVE' ? (
                        <button 
                          title="Freeze Wallet"
                          onClick={() => freezeMutation.mutate(wallet.walletId)}
                          className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 rounded-xl transition-colors border border-rose-100 dark:border-rose-800/50"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          title="Unfreeze Wallet"
                          onClick={() => unfreezeMutation.mutate(wallet.walletId)}
                          className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-xl transition-colors border border-emerald-100 dark:border-emerald-800/50"
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
      
      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between text-sm bg-gray-50/30 dark:bg-gray-900/20">
        <span className="text-gray-500 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-900 dark:text-white">{data?.content?.length || 0}</span> active wallets
        </span>
        <div className="flex space-x-2">
          <button 
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl disabled:opacity-50 text-gray-700 dark:text-gray-300 font-medium hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm disabled:shadow-none"
          >
            Previous
          </button>
          <button 
            disabled={data?.last}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl disabled:opacity-50 text-gray-700 dark:text-gray-300 font-medium hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm disabled:shadow-none"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
