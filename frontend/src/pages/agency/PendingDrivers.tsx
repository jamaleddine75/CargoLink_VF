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
      <AdminBreadcrumb items={[{ label: 'Espace Agence' }, { label: 'Approbations' }]} />
      <PageHeader
        title="Approbations des livreurs"
        description="Vérifiez et validez les nouveaux livreurs rattachés à votre agence."
      />
      <PendingApprovals
        service={service}
        title=""
        description=""
        emptyMessage="Aucun livreur en attente d'approbation"
      />
    </div>
  );
}
