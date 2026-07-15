import React from 'react';
import { Truck } from 'lucide-react';
import agencyService from '@/services/api/agencyService';
import AdminBreadcrumb from '@/components/shared/AdminBreadcrumb';
import PageHeader from '@/components/shared/PageHeader';
import PendingApprovals from '@/components/shared/PendingApprovals';

export default function AgencyPendingDrivers() {
  const service = {
    fetchPending: () => agencyService.getPendingDrivers(),
    approve: (id: string) => agencyService.approveDriver(id),
    reject: (id: string, reason?: string) => agencyService.rejectDriver(id, reason),
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminBreadcrumb items={[{ label: 'Agency Hub' }, { label: 'Approvals' }]} />
      <PageHeader
        title="Driver Approvals"
        description="Review and validate new drivers assigned to your agency."
      />
      <PendingApprovals
        service={service}
        title=""
        description=""
        emptyMessage="No drivers pending approval"
      />
    </div>
  );
}
