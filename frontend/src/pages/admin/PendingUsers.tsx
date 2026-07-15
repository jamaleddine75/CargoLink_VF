import React from 'react';
import adminService from '@/services/api/adminService';
import AdminBreadcrumb from '@/components/shared/AdminBreadcrumb';
import PageHeader from '@/components/shared/PageHeader';
import PendingApprovals from '@/components/shared/PendingApprovals';

export default function PendingUsers() {
  const service = {
    fetchPending: () => adminService.getPendingUsers(),
    approve: (id: string) => adminService.activateUser(id),
    reject: (id: string, reason?: string) => adminService.rejectUser(id, reason),
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminBreadcrumb items={[{ label: 'Administration' }, { label: 'Pending Approvals' }]} />
      <PageHeader
        title="Pending Approvals"
        description="Review and validate new platform registrations."
      />
      <PendingApprovals service={service} title="" description="" />
    </div>
  );
}
