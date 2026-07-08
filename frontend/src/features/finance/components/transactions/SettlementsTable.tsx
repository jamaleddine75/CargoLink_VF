import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financialService } from '../../api/financialService';

import { Search, Filter, Download, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export const SettlementsTable = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-MA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin_finance_withdrawals', page, size, statusFilter],
    queryFn: () => financialService.getWithdrawals(page, size, statusFilter),
    refetchInterval: 30000,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'PENDING':
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
      case 'FAILED':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading settlements...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl rounded-3xl shadow-sm border border-rose-200 dark:border-rose-900/50 flex items-center justify-center min-h-[400px]">
        <p className="text-rose-500 font-medium">Failed to load settlements. Please check network connection.</p>
      </div>
    );
  }

  const withdrawals = data?.content || [];

  return (
    <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden flex flex-col">
      {/* Header & Filters */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settlements & Payouts</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage withdrawal requests and automated payouts</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by ID or email..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-100/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-gray-900 dark:text-white"
            />
          </div>
          
          <button className="p-2 border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Request Details</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Method</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Timeline</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
            {withdrawals.map((req: any) => (
              <tr key={req.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                      <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {req.id.substring(0, 8).toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                        {req.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(req.amount)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white font-medium capitalize">
                    {req.provider || 'Bank Transfer'}
                  </div>
                  {req.paypalEmail && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {req.paypalEmail}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(req.status)}
                  {req.status === 'REJECTED' && req.rejectionReason && (
                    <div className="text-xs text-rose-500 mt-1 max-w-[150px] truncate" title={req.rejectionReason}>
                      {req.rejectionReason}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    Requested: <span className="font-medium">{formatDate(req.createdAt)}</span>
                  </div>
                  {req.completedAt && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Completed: {formatDate(req.completedAt)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            
            {withdrawals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No settlements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between bg-gray-50/30 dark:bg-gray-900/30">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing Page <span className="font-semibold text-gray-900 dark:text-white">{data.currentPage + 1}</span> of <span className="font-semibold text-gray-900 dark:text-white">{data.totalPages}</span>
          </span>
          <div className="flex space-x-2">
            <button 
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg border border-gray-200/50 dark:border-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPage(page + 1)}
              disabled={data.last}
              className="p-2 rounded-lg border border-gray-200/50 dark:border-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
