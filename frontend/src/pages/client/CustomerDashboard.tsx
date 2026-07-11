import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Package, Activity, CheckCircle2, 
  Plus, RefreshCw, Wallet, Box
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import customerService from '@/services/api/customerService';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import EntityCard from '@/components/shared/EntityCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatTimestamp } from '@/lib/utils';
import { ListSkeleton } from '@/pages/agency/shared';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [kpiData, ordersData] = await Promise.all([
        customerService.getKPIs(user.id),
        customerService.getRecentOrders(0, 5)
      ]);
      setKpis(kpiData);
      setRecentOrders(ordersData.content || []);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Client Dashboard"
        description="Vue d'ensemble de vos expéditions et transactions"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/client/create-order')}
              className="gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Nouvelle Expédition
            </Button>
          </div>
        }
      />

      {/* KPI HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Missions" value={kpis?.totalSent || 0} icon={Box} loading={loading} />
        <StatCard title="En Cours" value={kpis?.inTransit || 0} icon={Activity} loading={loading} />
        <StatCard title="Livré" value={kpis?.delivered || 0} icon={CheckCircle2} loading={loading} />
        <StatCard title="Portefeuille" value={kpis?.pendingPayment || 0} icon={Wallet} suffix=" MAD" loading={loading} />
      </div>

      {/* Recent Missions list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Missions Récentes</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/client/orders')}
            className="text-primary hover:bg-primary/10 font-semibold text-xs"
          >
            Voir tout
          </Button>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <ListSkeleton />
            ) : recentOrders.length > 0 ? (
              recentOrders.map((order: any) => (
                <EntityCard
                  key={order.id}
                  onClick={() => navigate(`/client/orders/${order.id}`)}
                  avatar={
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <Package className="w-5 h-5" />
                    </div>
                  }
                  title={order.trackingNumber}
                  subtitle={`${order.receiverName} • ${order.receiverAddress} • ${formatTimestamp(order.createdAt)}`}
                  statusBadge={<StatusBadge status={order.status} />}
                />
              ))
            ) : (
              <Card className="border border-border bg-card shadow-sm p-12 text-center">
                <Box className="w-10 h-10 text-muted-foreground/45 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Aucune mission récente trouvée</p>
              </Card>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;