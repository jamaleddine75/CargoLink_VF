import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Search, Maximize2, Minimize2, Command, RefreshCw,
  AlertTriangle, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { FinancialSidebar, SIDEBAR_ITEMS } from '../components/layout/FinancialSidebar';
import { OverviewDashboard } from '../components/overview/OverviewDashboard';
import { UnifiedWalletTable } from '../components/wallets/UnifiedWalletTable';
import { FinancialTransactionsTable } from '../components/transactions/FinancialTransactionsTable';
import { SettlementsBoard } from '../components/settlements/SettlementsBoard';
import { WithdrawalsApproval } from '../components/withdrawals/WithdrawalsApproval';
import { ReportsPanel } from '../components/reports/ReportsPanel';
import { AnalyticsPanel } from '../components/analytics/AnalyticsPanel';
import { SettlementsTable } from '../components/transactions/SettlementsTable';
import { FinancialAuditLogsTable } from '../components/transactions/FinancialAuditLogsTable';
import { financialService } from '../api/financialService';

export const FinancialCenterPage: React.FC = () => {
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const queryClient = useQueryClient();

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const { data: settings } = useQuery({
    queryKey: ['finance-settings'],
    queryFn: () => financialService.getFinanceSettings(),
  });

  const { data: ledgerAccounts } = useQuery({
    queryKey: ['ledger-accounts'],
    queryFn: () => financialService.getLedgerAccounts(),
    enabled: activeTab === 'ledger',
  });

  const { data: journalEntries } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => financialService.getJournalEntries(),
    enabled: activeTab === 'ledger',
  });

  const { data: reconciliations, refetch: refetchReconciliations } = useQuery({
    queryKey: ['reconciliations'],
    queryFn: () => financialService.getReconciliations(),
    enabled: activeTab === 'reconciliation',
  });

  const { data: fraudAlerts, refetch: refetchFraudAlerts } = useQuery({
    queryKey: ['fraud-alerts'],
    queryFn: () => financialService.getFraudAlerts(),
    enabled: activeTab === 'fraud',
  });

  const [settingsForm, setSettingsForm] = useState({
    platformFeeRate: '',
    defaultAgencyCommissionRate: '',
    clientSettlementFormula: 'COD_MINUS_FEE',
    autoReconcileDailyBatch: true,
    debtAlertThreshold: '',
  });

  useEffect(() => {
    if (!settings) return;
    setSettingsForm({
      platformFeeRate: String((settings.platformFeeRate ?? 0) * 100),
      defaultAgencyCommissionRate: String((settings.defaultAgencyCommissionRate ?? 0) * 100),
      clientSettlementFormula: settings.clientSettlementFormula ?? 'COD_MINUS_FEE',
      autoReconcileDailyBatch: settings.autoReconcileDailyBatch ?? true,
      debtAlertThreshold: String(settings.debtAlertThreshold ?? 0),
    });
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: () => financialService.updateFinanceSettings({
      platformFeeRate: Number(settingsForm.platformFeeRate) / 100,
      defaultAgencyCommissionRate: Number(settingsForm.defaultAgencyCommissionRate) / 100,
      clientSettlementFormula: settingsForm.clientSettlementFormula as 'COD_MINUS_FEE' | 'COD_FULL',
      autoReconcileDailyBatch: settingsForm.autoReconcileDailyBatch,
      debtAlertThreshold: Number(settingsForm.debtAlertThreshold),
    }),
    onSuccess: () => {
      toast.success('Financial settings updated');
      queryClient.invalidateQueries({ queryKey: ['finance-settings'] });
    },
    onError: () => toast.error('Failed to update financial settings'),
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cmdFiltered = cmdSearch
    ? SIDEBAR_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(cmdSearch.toLowerCase()))
    : SIDEBAR_ITEMS;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard />;
      case 'wallets':
        return <UnifiedWalletTable />;
      case 'transactions':
        return <FinancialTransactionsTable />;
      case 'settlements':
        return <SettlementsBoard />;
      case 'withdrawals':
        return <WithdrawalsApproval />;
      case 'reports':
        return <ReportsPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'ledger':
        return (
          <div className="space-y-6">
            <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/90 mb-4">Chart of Accounts</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] text-white/30 border-b border-white/[0.06]">
                      <th className="pb-3 font-medium">Code</th>
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Currency</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerAccounts?.map((acc: any) => (
                      <tr key={acc.id} className="border-b border-white/[0.04] text-xs text-white/60">
                        <td className="py-3 font-mono text-white/40">{acc.code}</td>
                        <td className="py-3 font-medium text-white/70">{acc.name}</td>
                        <td className="py-3">
                          <Badge className={cn('text-[10px] border-0',
                            acc.type === 'ASSET' ? 'bg-emerald-500/10 text-emerald-400' :
                            acc.type === 'LIABILITY' ? 'bg-blue-500/10 text-blue-400' :
                            acc.type === 'REVENUE' ? 'bg-purple-500/10 text-purple-400' :
                            'bg-orange-500/10 text-orange-400'
                          )}>{acc.type}</Badge>
                        </td>
                        <td className="py-3 text-white/40">{acc.currency}</td>
                        <td className="py-3">{acc.active ? 'Active' : 'Inactive'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/90 mb-4">Journal Entries</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] text-white/30 border-b border-white/[0.06]">
                      <th className="pb-3 font-medium">Description</th>
                      <th className="pb-3 font-medium">Ref Type</th>
                      <th className="pb-3 font-medium">Ref ID</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalEntries?.map((je: any) => (
                      <tr key={je.id} className="border-b border-white/[0.04] text-xs text-white/60">
                        <td className="py-3 text-white/70">{je.description}</td>
                        <td className="py-3 font-mono text-white/40">{je.referenceType || 'N/A'}</td>
                        <td className="py-3 font-mono text-white/40">{je.referenceId || 'N/A'}</td>
                        <td className="py-3">
                          <Badge className="bg-emerald-500/10 text-emerald-400 text-[10px] border-0">{je.status}</Badge>
                        </td>
                        <td className="py-3 text-white/40">{je.postedAt ? new Date(je.postedAt).toLocaleString() : 'Draft'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'reconciliation':
        return (
          <div className="space-y-6">
            <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white/90">Cash Reconciliation</h3>
                <p className="text-xs text-white/40 mt-0.5">Match expected COD against collected and settled amounts</p>
              </div>
              <Button onClick={async () => {
                try {
                  await financialService.runManualReconciliation();
                  toast.success('Reconciliation completed');
                  refetchReconciliations();
                } catch { toast.error('Reconciliation failed'); }
              }} className="bg-indigo-600 hover:bg-indigo-500 text-xs h-9">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Run Reconciliation
              </Button>
            </div>
            <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/90 mb-4">Reconciliation History</h3>
              {(!reconciliations || reconciliations.length === 0) ? (
                <div className="py-8 text-center text-xs text-white/30">No records yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] text-white/30 border-b border-white/[0.06]">
                        <th className="pb-3 font-medium">Expected</th>
                        <th className="pb-3 font-medium">Collected</th>
                        <th className="pb-3 font-medium">Difference</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reconciliations.map((rep: any) => (
                        <tr key={rep.id} className="border-b border-white/[0.04] text-xs text-white/60">
                          <td className="py-3 font-medium text-white/70">{Number(rep.expectedCod).toLocaleString()} MAD</td>
                          <td className="py-3">{Number(rep.collectedCod).toLocaleString()} MAD</td>
                          <td className={cn('py-3 font-medium', rep.difference !== 0 ? 'text-rose-400' : 'text-emerald-400')}>
                            {Number(rep.difference).toLocaleString()} MAD
                          </td>
                          <td className="py-3">
                            <Badge className={cn('text-[10px] border-0', rep.status === 'MATCHED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400')}>
                              {rep.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-white/40">{new Date(rep.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      case 'fraud':
        return (
          <div className="space-y-6">
            <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white/90">Fraud Detection & Risk</h3>
                <p className="text-xs text-white/40 mt-0.5">Automated compliance scans for balance and withdrawal anomalies</p>
              </div>
              <Button onClick={async () => {
                try {
                  await financialService.runFraudScan();
                  toast.success('Fraud scan completed');
                  refetchFraudAlerts();
                } catch { toast.error('Scan failed'); }
              }} className="bg-indigo-600 hover:bg-indigo-500 text-xs h-9">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Run Risk Scan
              </Button>
            </div>
            <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/90 mb-4">Active Alerts</h3>
              {(!fraudAlerts || fraudAlerts.length === 0) ? (
                <div className="py-8 text-center text-xs text-white/30">No alerts — all clear</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] text-white/30 border-b border-white/[0.06]">
                        <th className="pb-3 font-medium">Rule</th>
                        <th className="pb-3 font-medium">Severity</th>
                        <th className="pb-3 font-medium">Message</th>
                        <th className="pb-3 font-medium">Reference</th>
                        <th className="pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fraudAlerts.map((alert: any) => (
                        <tr key={alert.id} className="border-b border-white/[0.04] text-xs text-white/60">
                          <td className="py-3 font-medium text-white/70">{alert.ruleName}</td>
                          <td className="py-3">
                            <Badge className={cn('text-[10px] border-0',
                              alert.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400' :
                              alert.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400' :
                              'bg-amber-500/10 text-amber-400'
                            )}>{alert.severity}</Badge>
                          </td>
                          <td className="py-3 max-w-xs truncate text-white/40">{alert.message}</td>
                          <td className="py-3 font-mono text-white/30">{alert.referenceId || 'N/A'}</td>
                          <td className="py-3 text-white/40">{new Date(alert.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      case 'audit':
        return <FinancialAuditLogsTable />;
      case 'settings':
        return (
          <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white/90">Financial Rules</h3>
              <p className="text-xs text-white/40 mt-0.5">Platform fee split, merchant settlement, and debt thresholds</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-white/60">Platform fee (%)</span>
                <input className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20"
                  value={settingsForm.platformFeeRate}
                  onChange={(e) => setSettingsForm(p => ({ ...p, platformFeeRate: e.target.value }))} />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-white/60">Default agency commission (%)</span>
                <input className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20"
                  value={settingsForm.defaultAgencyCommissionRate}
                  onChange={(e) => setSettingsForm(p => ({ ...p, defaultAgencyCommissionRate: e.target.value }))} />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-white/60">Client settlement formula</span>
                <select className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white/80"
                  value={settingsForm.clientSettlementFormula}
                  onChange={(e) => setSettingsForm(p => ({ ...p, clientSettlementFormula: e.target.value }))}>
                  <option value="COD_MINUS_FEE">COD minus fee</option>
                  <option value="COD_FULL">Full COD</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-white/60">Debt alert threshold (MAD)</span>
                <input className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20"
                  value={settingsForm.debtAlertThreshold}
                  onChange={(e) => setSettingsForm(p => ({ ...p, debtAlertThreshold: e.target.value }))} />
              </label>
            </div>
            <label className="flex items-center gap-2.5 text-xs font-medium text-white/60">
              <input type="checkbox" checked={settingsForm.autoReconcileDailyBatch}
                onChange={(e) => setSettingsForm(p => ({ ...p, autoReconcileDailyBatch: e.target.checked }))}
                className="rounded border-white/20" />
              Auto-run daily reconciliation
            </label>
            <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-4 text-xs text-indigo-300/80">
              On 100 MAD delivery fee: platform gets {(Number(settingsForm.platformFeeRate) || 0).toFixed(2)} MAD before agency and driver split.
            </div>
            <div className="flex justify-end">
              <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}
                className="bg-indigo-600 hover:bg-indigo-500 text-xs h-9 px-5">
                {saveSettings.isPending ? 'Saving...' : 'Save settings'}
              </Button>
            </div>
          </div>
        );
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="flex h-full bg-[#0A0C10] text-white overflow-hidden">
      {/* Sidebar */}
      <FinancialSidebar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-14 px-6 border-b border-white/[0.06] bg-[#0A0C10] shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-white/80 tracking-tight">
              {SIDEBAR_ITEMS.find(t => t.id === activeTab)?.label || 'Financial Center'}
            </h1>
            <Badge variant="outline" className="text-[9px] border-white/[0.06] text-white/30 px-1.5 py-0">
              {activeTab}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCmdPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/30 hover:text-white/50 hover:bg-white/[0.06] transition-all"
            >
              <Command className="w-3.5 h-3.5" />
              <span>Quick search...</span>
              <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/20">⌘K</kbd>
            </button>
            <button onClick={toggleFullscreen} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all">
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-[10px] font-bold shadow-lg shadow-indigo-500/30">
              SA
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Command Palette Overlay */}
      <AnimatePresence>
        {cmdPaletteOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
            onClick={() => setCmdPaletteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#151821] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                <Search className="w-4 h-4 text-white/30 shrink-0" />
                <input
                  autoFocus
                  value={cmdSearch}
                  onChange={(e) => setCmdSearch(e.target.value)}
                  placeholder="Search pages, actions, and settings..."
                  className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/20 outline-none"
                />
                <kbd className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.06] text-white/20">ESC</kbd>
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {cmdFiltered.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { handleTabChange(item.id); setCmdPaletteOpen(false); setCmdSearch(''); }}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs transition-all',
                        isActive ? 'bg-indigo-500/15 text-indigo-300' : 'text-white/60 hover:bg-white/[0.04] hover:text-white/80'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                      {isActive && <Badge className="ml-auto text-[9px] bg-indigo-500/20 text-indigo-300 border-0">Active</Badge>}
                    </button>
                  );
                })}
                {cmdFiltered.length === 0 && (
                  <div className="py-8 text-center text-xs text-white/20">No results found</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
