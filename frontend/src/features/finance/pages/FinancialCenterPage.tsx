import React, { useState } from 'react';
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

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'wallets', label: 'Global Wallets', icon: Wallet },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'withdrawals', label: 'Settlements', icon: Download },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export const FinancialCenterPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

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
        return <div className="p-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center min-h-[400px] text-gray-500">Financial Rules & Settings</div>;
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
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Financial Center</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg ml-14">Centralized control for global liquidity, settlements, and compliance.</p>
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
