import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financialService } from '../../api/financialService';
import { formatDate } from '../../../../utils/formatters';
import { Search, Filter, ShieldAlert, Activity, User, MonitorSmartphone, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

export const FinancialAuditLogsTable = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin_finance_audit_logs', page, size, actionFilter, actorFilter],
    queryFn: () => financialService.getAuditLogs(page, size, actionFilter, actorFilter),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="p-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading audit logs...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl rounded-3xl shadow-sm border border-rose-200 dark:border-rose-900/50 flex items-center justify-center min-h-[400px]">
        <p className="text-rose-500 font-medium">Failed to load audit logs. Please check network connection.</p>
      </div>
    );
  }

  const logs = data?.content || [];

  return (
    <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden flex flex-col">
      {/* Header & Filters */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Audit Logs
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Immutable record of all administrative and financial actions</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search actor or action..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-100/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-gray-900 dark:text-white"
            />
          </div>
          
          <button className="p-2 border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300">
            <Filter className="w-4 h-4" />
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-100 dark:border-indigo-800/50">
            <FileText className="w-4 h-4" />
            <span>Export Log</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Action Event</th>
              <th className="px-6 py-4 font-semibold">Actor</th>
              <th className="px-6 py-4 font-semibold">Target Entity</th>
              <th className="px-6 py-4 font-semibold">IP Address</th>
              <th className="px-6 py-4 font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
            {logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                        {log.action.replace(/_/g, ' ').toLowerCase()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                        {log.id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.actor || 'System'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {log.target || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <MonitorSmartphone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {log.ipAddress || 'Unknown'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                </td>
              </tr>
            ))}
            
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No audit logs found matching your criteria.
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
