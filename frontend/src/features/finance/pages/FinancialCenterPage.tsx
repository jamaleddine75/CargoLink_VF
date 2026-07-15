import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, AlertTriangle, LayoutDashboard, Wallet,
  ArrowLeftRight, Download, FileText, BarChart3, Settings, FileCheck, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

import { OverviewDashboard } from '../components/overview/OverviewDashboard';
import { UnifiedWalletTable } from '../components/wallets/UnifiedWalletTable';
import { FinancialTransactionsTable } from '../components/transactions/FinancialTransactionsTable';
import { SettlementsBoard } from '../components/settlements/SettlementsBoard';
import { WithdrawalsApproval } from '../components/withdrawals/WithdrawalsApproval';
import { ReportsPanel } from '../components/reports/ReportsPanel';
import { AnalyticsPanel } from '../components/analytics/AnalyticsPanel';
import { FinancialAuditLogsTable } from '../components/transactions/FinancialAuditLogsTable';
import { financialService } from '../api/financialService';
import PageHeader from '@/components/shared/PageHeader';
import AdminBreadcrumb from '@/components/shared/AdminBreadcrumb';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'wallets', label: 'Wallets', icon: Wallet },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'settlements', label: 'Settlements', icon: FileCheck },
  { id: 'withdrawals', label: 'Withdrawals', icon: Download },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reconciliation', label: 'Reconciliation', icon: FileCheck },
  { id: 'fraud', label: 'Fraud Detection', icon: ShieldAlert },
  { id: 'audit', label: 'Audit Logs', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const FinancialCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

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
            <Card>
              <CardHeader>
                <CardTitle>Chart of Accounts</CardTitle>
                <CardDescription>Accounts setup and category mappings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b border-border">
                        <th className="pb-3 font-medium">Code</th>
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Currency</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerAccounts?.map((acc: any) => (
                        <tr key={acc.id} className="border-b border-border text-xs text-foreground">
                          <td className="py-3 font-mono text-muted-foreground">{acc.code}</td>
                          <td className="py-3 font-medium">{acc.name}</td>
                          <td className="py-3">
                            <Badge variant="outline" className={cn('text-[10px]',
                              acc.type === 'ASSET' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                              acc.type === 'LIABILITY' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                              acc.type === 'REVENUE' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                              'bg-orange-500/10 text-orange-600 border-orange-500/20'
                            )}>{acc.type}</Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">{acc.currency}</td>
                          <td className="py-3">{acc.active ? 'Active' : 'Inactive'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Journal Entries</CardTitle>
                <CardDescription>Raw accounting journal transactions ledger</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b border-border">
                        <th className="pb-3 font-medium">Description</th>
                        <th className="pb-3 font-medium">Ref Type</th>
                        <th className="pb-3 font-medium">Ref ID</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journalEntries?.map((je: any) => (
                        <tr key={je.id} className="border-b border-border text-xs text-foreground">
                          <td className="py-3 font-medium">{je.description}</td>
                          <td className="py-3 font-mono text-muted-foreground">{je.referenceType || 'N/A'}</td>
                          <td className="py-3 font-mono text-muted-foreground">{je.referenceId || 'N/A'}</td>
                          <td className="py-3">
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">{je.status}</Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">{je.postedAt ? new Date(je.postedAt).toLocaleString() : 'Draft'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'reconciliation':
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
                <div>
                  <h3 className="text-sm font-semibold">Cash Reconciliation</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Match expected COD against collected and settled amounts</p>
                </div>
                <Button onClick={async () => {
                  try {
                    await financialService.runManualReconciliation();
                    toast.success('Reconciliation completed');
                    refetchReconciliations();
                  } catch { toast.error('Reconciliation failed'); }
                }} className="text-xs h-9">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Run Reconciliation
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reconciliation History</CardTitle>
              </CardHeader>
              <CardContent>
                {(!reconciliations || reconciliations.length === 0) ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">No records yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs text-muted-foreground border-b border-border">
                          <th className="pb-3 font-medium">Expected</th>
                          <th className="pb-3 font-medium">Collected</th>
                          <th className="pb-3 font-medium">Difference</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reconciliations.map((rep: any) => (
                          <tr key={rep.id} className="border-b border-border text-xs text-foreground">
                            <td className="py-3 font-medium">{Number(rep.expectedCod).toLocaleString()} MAD</td>
                            <td className="py-3">{Number(rep.collectedCod).toLocaleString()} MAD</td>
                            <td className={cn('py-3 font-medium', rep.difference !== 0 ? 'text-red-600' : 'text-emerald-600')}>
                              {Number(rep.difference).toLocaleString()} MAD
                            </td>
                            <td className="py-3">
                              <Badge className={cn('text-[10px] border-0', rep.status === 'MATCHED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600')}>
                                {rep.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-muted-foreground">{new Date(rep.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'fraud':
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
                <div>
                  <h3 className="text-sm font-semibold">Fraud Detection & Risk</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Automated compliance scans for balance and withdrawal anomalies</p>
                </div>
                <Button onClick={async () => {
                  try {
                    await financialService.runFraudScan();
                    toast.success('Fraud scan completed');
                    refetchFraudAlerts();
                  } catch { toast.error('Scan failed'); }
                }} className="text-xs h-9">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Run Risk Scan
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {(!fraudAlerts || fraudAlerts.length === 0) ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">No alerts — all clear</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs text-muted-foreground border-b border-border">
                          <th className="pb-3 font-medium">Rule</th>
                          <th className="pb-3 font-medium">Severity</th>
                          <th className="pb-3 font-medium">Message</th>
                          <th className="pb-3 font-medium">Reference</th>
                          <th className="pb-3 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fraudAlerts.map((alert: any) => (
                          <tr key={alert.id} className="border-b border-border text-xs text-foreground">
                            <td className="py-3 font-medium">{alert.ruleName}</td>
                            <td className="py-3">
                              <Badge className={cn('text-[10px] border-0',
                                alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-600' :
                                alert.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-600' :
                                'bg-amber-500/10 text-amber-600'
                              )}>{alert.severity}</Badge>
                            </td>
                            <td className="py-3 max-w-xs truncate text-muted-foreground">{alert.message}</td>
                            <td className="py-3 font-mono text-muted-foreground">{alert.referenceId || 'N/A'}</td>
                            <td className="py-3 text-muted-foreground">{new Date(alert.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'audit':
        return <FinancialAuditLogsTable />;
      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Financial Rules</CardTitle>
              <CardDescription>Platform fee split, merchant settlement, and debt thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1.5 flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">Platform fee (%)</span>
                  <input className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    value={settingsForm.platformFeeRate}
                    onChange={(e) => setSettingsForm(p => ({ ...p, platformFeeRate: e.target.value }))} />
                </label>
                <label className="space-y-1.5 flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">Default agency commission (%)</span>
                  <input className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    value={settingsForm.defaultAgencyCommissionRate}
                    onChange={(e) => setSettingsForm(p => ({ ...p, defaultAgencyCommissionRate: e.target.value }))} />
                </label>
                <label className="space-y-1.5 flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">Client settlement formula</span>
                  <select className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground"
                    value={settingsForm.clientSettlementFormula}
                    onChange={(e) => setSettingsForm(p => ({ ...p, clientSettlementFormula: e.target.value }))}>
                    <option value="COD_MINUS_FEE">COD minus fee</option>
                    <option value="COD_FULL">Full COD</option>
                  </select>
                </label>
                <label className="space-y-1.5 flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">Debt alert threshold (MAD)</span>
                  <input className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    value={settingsForm.debtAlertThreshold}
                    onChange={(e) => setSettingsForm(p => ({ ...p, debtAlertThreshold: e.target.value }))} />
                </label>
              </div>
              <label className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={settingsForm.autoReconcileDailyBatch}
                  onChange={(e) => setSettingsForm(p => ({ ...p, autoReconcileDailyBatch: e.target.checked }))}
                  className="rounded border-border" />
                Auto-run daily reconciliation
              </label>
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 text-xs text-primary">
                On 100 MAD delivery fee: platform gets {(Number(settingsForm.platformFeeRate) || 0).toFixed(2)} MAD before agency and driver split.
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}
                  className="text-xs h-9 px-5">
                  {saveSettings.isPending ? 'Saving...' : 'Save settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="space-y-6 pb-12 text-foreground">
      <AdminBreadcrumb items={[{ label: 'Administration' }, { label: 'Financial Center' }]} />

      <PageHeader
        title="Financial Center"
        description="Monitor system balance, transaction history, withdrawals, and fee settings."
        action={
          <Button onClick={() => queryClient.invalidateQueries()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </Button>
        }
      />

      {/* Tabs list matching admin portal design system */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar py-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
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
      </div>
    </div>
  );
};
