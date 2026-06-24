import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Download, Filter, AlertCircle, Users, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import AdminTable from '@/components/admin/AdminTable';
import Tabs from '@/components/admin/Tabs';
import SearchInput from '@/components/admin/SearchInput';
import adminUserService from '@/services/adminUserService';
import { User, PagedResponse } from '@/types';

const ADMIN_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'SUSPENDED', label: 'Suspended' },
];

const AdminsManagement: React.FC = () => {
  const navigate = useNavigate();
  // State
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });

  // Fetch Admins
  const fetchAdmins = useCallback(async (page = 0) => {
    try {
      setLoading(true);
      setError(null);
      const response: PagedResponse<User> = await adminUserService.getAdmins(
        page,
        pagination.pageSize,
        activeTab,
        searchQuery
      );
      
      setAdmins(response.content);
      setPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
        pageSize: response.pageSize,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load admins. Please try again.');
      toast.error('Error fetching admins');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, pagination.pageSize]);

  useEffect(() => {
    fetchAdmins(0);
  }, [activeTab, searchQuery]);

  // Handlers
  const handleApprove = async (id: string) => {
    try {
      await adminUserService.approveAdmin(id);
      toast.success('Admin approved successfully');
      fetchAdmins(pagination.currentPage);
    } catch (err) {
      toast.error('Failed to approve admin');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await adminUserService.rejectAdmin(id);
      toast.success('Admin rejected');
      fetchAdmins(pagination.currentPage);
    } catch (err) {
      toast.error('Failed to reject admin');
    }
  };

  const handleSuspend = async (id: string, suspend: boolean) => {
    try {
      await adminUserService.suspendAdmin(id, suspend);
      toast.success(suspend ? 'Admin suspended' : 'Admin unsuspended');
      fetchAdmins(pagination.currentPage);
    } catch (err) {
      toast.error('Failed to update admin status');
    }
  };

  const handleViewDetails = (admin: User) => {
    toast.info(`Viewing details for ${admin.firstName}`);
  };

  const handlePageChange = (page: number) => {
    if (page >= 0 && page < pagination.totalPages) {
      fetchAdmins(page);
    }
  };

  const handleExportAdmins = () => {
    if (!admins.length) {
      toast.info('No admins to export');
      return;
    }

    const csvEscape = (value: unknown) => {
      const str = String(value ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      'id',
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'agencyName',
      'status',
      'createdAt',
    ];

    const rows = admins.map((admin) =>
      [
        admin.id,
        admin.firstName,
        admin.lastName,
        admin.email,
        admin.phoneNumber,
        admin.agencyName,
        admin.status,
        admin.createdAt,
      ]
        .map(csvEscape)
        .join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admins_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Admin export generated');
  };

  const handleAddAdmin = () => {
    navigate('/admin/users/pending');
    toast.info('Open pending users to approve or onboard a new admin');
  };

  const handleQuickFilter = () => {
    const nextTab = activeTab === 'PENDING' ? 'ALL' : 'PENDING';
    setActiveTab(nextTab);
    setSearchQuery('');
    toast.info(nextTab === 'PENDING' ? 'Showing pending admins' : 'Showing all admins');
  };

  return (
    <div className="relative min-h-screen p-4 sm:p-6 md:p-8 space-y-4 md:space-y-8 animate-in fade-in duration-700 overflow-hidden pb-10">
      {/* Background Orbs & Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="mesh-gradient absolute inset-0 opacity-40 dark:opacity-20" />
        <div className="grid-pattern absolute inset-0 opacity-30 dark:opacity-10" />
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 premium-glass p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-border/60 dark:border-border/40 shadow-card">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight uppercase leading-none">
              Admins <span className="text-primary">Management</span>
            </h1>
          </div>
          <p className="text-muted-foreground font-medium max-w-lg text-[11px] md:text-base">
            Complete control over system security and administrative access. Monitor, approve, and manage all platform admins.
          </p>
        </div>
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
          <Button onClick={handleExportAdmins} variant="outline" className="hidden sm:flex gap-2 h-10 md:h-12 px-4 md:px-6 rounded-xl border-border/60 hover:bg-muted/50 transition-all font-bold text-[9px] md:text-[10px] uppercase tracking-widest">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button onClick={handleAddAdmin} className="h-10 md:h-12 px-6 md:px-8 rounded-xl shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold text-[9px] md:text-[10px] uppercase tracking-widest gap-2 flex-1 md:flex-none">
            <Plus className="h-4 w-4" />
            Add New Admin
          </Button>
        </div>
      </div>

      {/* Stats Quick View (Added for WOW factor) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Admins', value: pagination.totalElements || 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Active', value: Array.isArray(admins) ? admins.filter(a => a?.status === 'ACTIVE').length : 0, icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Pending Approval', value: Array.isArray(admins) ? admins.filter(a => a?.status === 'PENDING').length : 0, icon: Filter, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Suspended', value: Array.isArray(admins) ? admins.filter(a => a?.status === 'SUSPENDED').length : 0, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map((stat, i) => (
          <div key={i} className="glass-card flex items-center gap-4 md:gap-5 border border-border/60 dark:border-border/40 p-4 md:p-6">
            <div className={`h-11 w-11 md:h-14 md:w-14 rounded-xl md:rounded-2xl ${stat.bg} flex items-center justify-center shadow-inner`}>
              <stat.icon className={`h-5 w-5 md:h-7 md:w-7 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              <p className="text-xl md:text-2xl font-black text-foreground leading-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-card/50 dark:bg-card/30 backdrop-blur-md rounded-2xl md:rounded-[2.5rem] border border-border/40 shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 md:p-8 border-b border-border/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <Tabs 
              tabs={ADMIN_TABS} 
              activeTab={activeTab} 
              onChange={setActiveTab}
              className="border-none p-0 w-auto"
            />
            <div className="flex items-center gap-3">
              <SearchInput 
                onSearch={setSearchQuery} 
                className="w-full lg:w-80 h-10 md:h-12" 
                placeholder="Search by name, email or agency..."
              />
              <Button onClick={handleQuickFilter} variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl border-border/60 hover:bg-muted/50">
                <Filter className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                <AlertCircle className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">System Sync Error</h3>
              <p className="text-muted-foreground mt-2 max-w-sm font-medium">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => fetchAdmins(0)} 
                className="mt-8 gap-2 rounded-xl h-12 px-8 border-rose-200 dark:border-rose-900 text-rose-600 font-bold uppercase text-[10px] tracking-widest"
              >
                Reconnect to API
              </Button>
            </div>
          ) : (
            <>
              <AdminTable
                admins={admins}
                isLoading={loading}
                onApprove={handleApprove}
                onReject={handleReject}
                onSuspend={handleSuspend}
                onViewDetails={handleViewDetails}
              />

              {/* Pagination */}
              {!loading && admins?.length > 0 && pagination.totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm font-medium text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border/40">
                    Showing <span className="font-black text-foreground">{admins.length}</span> of <span className="font-black text-foreground">{pagination.totalElements}</span> administrators
                  </p>
                  <Pagination className="w-auto ml-0">
                    <PaginationContent className="gap-2">
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          className={pagination.currentPage === 0 ? "pointer-events-none opacity-40" : "cursor-pointer h-10 px-4 rounded-xl border-border/60"}
                        />
                      </PaginationItem>
                      
                      {[...Array(pagination.totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            isActive={pagination.currentPage === i}
                            onClick={() => handlePageChange(i)}
                            className="cursor-pointer h-10 w-10 rounded-xl font-bold transition-all"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          className={pagination.currentPage === pagination.totalPages - 1 ? "pointer-events-none opacity-40" : "cursor-pointer h-10 px-4 rounded-xl border-border/60"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminsManagement;
