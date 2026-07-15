import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Calendar, Download, FileText, FileSpreadsheet, FilePieChart, BarChart3, Users, Building, CreditCard, Package
} from 'lucide-react';
import { financialService } from '../../api/financialService';
import { toast } from 'sonner';

const reportTypes = [
  {
    id: 'daily', label: 'Daily Report', icon: Calendar,
    desc: 'End-of-day financial snapshot',
    formats: ['CSV', 'PDF'],
  },
  {
    id: 'weekly', label: 'Weekly Summary', icon: FileSpreadsheet,
    desc: '7-day revenue and settlement overview',
    formats: ['CSV', 'PDF'],
  },
  {
    id: 'monthly', label: 'Monthly Statement', icon: FilePieChart,
    desc: 'Full monthly financial reconciliation',
    formats: ['CSV', 'PDF'],
  },
  {
    id: 'yearly', label: 'Annual Report', icon: BarChart3,
    desc: 'Year-over-year platform performance',
    formats: ['PDF'],
  },
  {
    id: 'drivers', label: 'Driver Earnings', icon: Users,
    desc: 'Per-driver payout and commission log',
    formats: ['CSV', 'PDF'],
  },
  {
    id: 'agencies', label: 'Agency Revenue', icon: Building,
    desc: 'Agency commission and COD collections',
    formats: ['CSV'],
  },
  {
    id: 'customers', label: 'Customer COD', icon: CreditCard,
    desc: 'Merchant COD settlements and fees',
    formats: ['CSV', 'PDF'],
  },
  {
    id: 'orders', label: 'Orders Log', icon: Package,
    desc: 'Delivery fee and COD breakdown',
    formats: ['CSV', 'PDF'],
  },
];

export const ReportsPanel: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (type: string, format: string) => {
    setDownloading(`${type}-${format}`);
    try {
      const blob = await financialService.exportFinanceData(type, undefined, undefined, 'COMPLETED');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report.${format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${type} ${format} exported successfully`);
    } catch (e) {
      toast.error('Failed to export report data');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* List Card */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Reports Registry</CardTitle>
          <CardDescription>Generate, view, and export platform-wide financial audit statements.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Supported Formats</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportTypes.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-semibold flex items-center gap-2.5 py-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <report.icon className="w-4 h-4" />
                    </div>
                    <span>{report.label}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{report.desc}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {report.formats.map((fmt) => (
                        <Badge key={fmt} variant="secondary" className="text-[10px] px-2 py-0.5">
                          {fmt}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {report.formats.map((fmt) => {
                        const isThis = downloading === `${report.id}-${fmt}`;
                        return (
                          <Button
                            key={fmt}
                            variant="outline"
                            size="sm"
                            disabled={downloading !== null}
                            onClick={() => handleDownload(report.id, fmt)}
                            className="text-[10px] h-7 px-2.5"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            {isThis ? 'Exporting...' : fmt}
                          </Button>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" /> Recent Generated Exports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { name: 'Monthly Statement June 2026', format: 'PDF', date: '2 hours ago', size: '2.4 MB' },
            { name: 'Weekly Summary W27', format: 'CSV', date: 'Yesterday', size: '845 KB' },
            { name: 'Driver Earnings Q2 2026', format: 'PDF', date: '3 days ago', size: '4.1 MB' },
          ].map((exp, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-foreground">{exp.name}</p>
                  <p className="text-[10px] text-muted-foreground">{exp.date} · {exp.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{exp.format}</Badge>
                <Button variant="ghost" size="sm" className="w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
