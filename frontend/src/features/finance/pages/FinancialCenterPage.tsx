import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  Download, 
  BarChart3, 
  FileText, 
  ShieldAlert, 
  Bell, 
  Settings,
  Activity
} from 'lucide-react';
import { KPIStatsGrid } from './../components/overview/KPIStatsGrid';
import { UnifiedWalletTable } from './../components/wallets/UnifiedWalletTable';
import { FinancialTransactionsTable } from './../components/transactions/FinancialTransactionsTable';
import { SettlementsTable } from './../components/transactions/SettlementsTable';
import { FinancialAuditLogsTable } from './../components/transactions/FinancialAuditLogsTable';
import { financialService } from '../api/financialService';
import { toast } from 'sonner';

const TABS = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { id: 'wallets', label: 'Portefeuilles', icon: Wallet },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'withdrawals', label: 'Règlements', icon: Download },
  { id: 'analytics', label: 'Analyses', icon: BarChart3 },
  { id: 'reports', label: 'Rapports', icon: FileText },
  { id: 'audit', label: 'Audit', icon: ShieldAlert },
  { id: 'settings', label: 'Paramètres', icon: Settings }
];

export const FinancialCenterPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ['finance-settings'],
    queryFn: () => financialService.getFinanceSettings(),
  });
  const [settingsForm, setSettingsForm] = useState({
    platformFeeRate: '',
    defaultAgencyCommissionRate: '',
    clientSettlementFormula: 'COD_MINUS_FEE',
    autoReconcileDailyBatch: true,
    debtAlertThreshold: '',
  });

  React.useEffect(() => {
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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <KPIStatsGrid />
          </div>
        );
      case 'wallets':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UnifiedWalletTable />
          </div>
        );
      case 'transactions':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FinancialTransactionsTable />
          </div>
        );
      case 'withdrawals':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettlementsTable />
          </div>
        );
      case 'analytics':
        return <div className="p-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center min-h-[400px] text-gray-500">Advanced Analytics Engine</div>;
      case 'reports':
        return <div className="p-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center min-h-[400px] text-gray-500">Reporting & Export Module</div>;
      case 'audit':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FinancialAuditLogsTable />
          </div>
        );
      case 'settings':
        return (
          <div className="p-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Rules</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Control the default platform fee split, merchant settlement rule, and debt alert threshold.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Platform fee (%)</span>
                <input className="w-full rounded-2xl border border-gray-200/70 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50 px-4 py-3"
                  value={settingsForm.platformFeeRate}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, platformFeeRate: e.target.value }))}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Default agency commission (%)</span>
                <input className="w-full rounded-2xl border border-gray-200/70 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50 px-4 py-3"
                  value={settingsForm.defaultAgencyCommissionRate}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, defaultAgencyCommissionRate: e.target.value }))}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Client settlement formula</span>
                <select
                  className="w-full rounded-2xl border border-gray-200/70 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50 px-4 py-3"
                  value={settingsForm.clientSettlementFormula}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, clientSettlementFormula: e.target.value }))}
                >
                  <option value="COD_MINUS_FEE">COD minus fee</option>
                  <option value="COD_FULL">Full COD</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Debt alert threshold (MAD)</span>
                <input className="w-full rounded-2xl border border-gray-200/70 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50 px-4 py-3"
                  value={settingsForm.debtAlertThreshold}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, debtAlertThreshold: e.target.value }))}
                />
              </label>
            </div>
            <label className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={settingsForm.autoReconcileDailyBatch}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, autoReconcileDailyBatch: e.target.checked }))}
              />
              Auto-run daily reconciliation
            </label>
            <div className="rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 p-5 text-sm text-indigo-900 dark:text-indigo-200">
              On 100 MAD delivery fee: platform gets {((Number(settingsForm.platformFeeRate) || 0)).toFixed(2)} MAD before agency and driver split.
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => saveSettings.mutate()}
                disabled={saveSettings.isPending}
                className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50"
              >
                {saveSettings.isPending ? 'Saving...' : 'Save settings'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] w-full min-h-screen relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-500/10 to-transparent dark:from-indigo-900/20 pointer-events-none" />
      <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full bg-blue-500/5 dark:bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-[20%] -left-[100px] w-[400px] h-[400px] rounded-full bg-purple-500/5 dark:bg-purple-600/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-20 px-8 py-8 md:px-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Centre Financier</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg ml-14">Pilotage centralisé des soldes, règlements, validations et rapports financiers.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-5 py-2.5 bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl text-gray-700 dark:text-gray-300 font-medium hover:bg-white hover:shadow-lg transition-all">
            <Bell className="w-5 h-5 text-gray-400" />
            <span>Alerts</span>
            <span className="flex h-2 w-2 relative -top-1 -right-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="relative z-20 px-8 md:px-10">
        <div className="flex space-x-1 overflow-x-auto no-scrollbar p-1.5 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl inline-flex w-full md:w-auto border border-gray-200/50 dark:border-gray-700/50">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-2.5 px-5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                  ${isActive 
                    ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-400 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50'}
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 p-8 md:px-10 flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};
