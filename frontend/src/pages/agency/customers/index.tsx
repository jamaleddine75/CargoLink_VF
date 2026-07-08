import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  UserPlus, 
  Mail, 
  Phone, 
  MapPin, 
  TrendingUp, 
  AlertTriangle, 
  Crown,
  Eye,
  Edit,
  Trash2,
  Ban,
  ShieldCheck,
  Download
} from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { agencyCustomerService, AgencyCustomer } from '@/services/api/agencyCustomerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AgencyCustomerModal } from '@/components/agency/customers/AgencyCustomerModal';
import { AgencyCustomerRequest } from '@/services/api/agencyCustomerService';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';

const AgencyCustomers = () => {
  const [customers, setCustomers] = useState<AgencyCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<unknown>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchCustomers = async () => {
    if (!user?.agencyId) {
      console.warn("[AgencyCustomers] Missing agencyId in user context", user);
      return;
    }

    try {
      setLoading(true);
      const response = await agencyCustomerService.getCustomers(user.agencyId, searchQuery);
      let customerList: AgencyCustomer[] = [];
      
      if (Array.isArray(response)) {
        customerList = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.content)) customerList = response.content;
        else if (Array.isArray(response.data)) customerList = response.data;
        else if (response.data && Array.isArray(response.data.content)) customerList = response.data.content;
        else if (Array.isArray(response.items)) customerList = response.items;
        else if (Array.isArray(response.result)) customerList = response.result;
        else {
          const firstArray = Object.values(response).find(v => Array.isArray(v));
          if (firstArray) customerList = firstArray as AgencyCustomer[];
        }
      }
      setCustomers(customerList);
      
      const analytics = await agencyCustomerService.getAnalytics(user.agencyId);
      if (analytics && typeof analytics === 'object') {
        const statsData = analytics.data || analytics.result || analytics;
        setStats(statsData);
      }
    } catch (error: unknown) {
      console.error("[AgencyCustomers] Fetch Error:", error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de charger les clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user?.agencyId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleStatusUpdate = async (customerId: string, status: 'activate' | 'suspend' | 'block') => {
    if (!user?.agencyId) return;
    try {
      if (status === 'activate') await agencyCustomerService.activateCustomer(user.agencyId, customerId);
      if (status === 'suspend') await agencyCustomerService.suspendCustomer(user.agencyId, customerId);
      if (status === 'block') await agencyCustomerService.blockCustomer(user.agencyId, customerId);
      
      toast({
        title: "Succès",
        description: `Statut du client mis à jour`,
      });
      fetchCustomers();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour du statut",
        variant: "destructive"
      });
    }
  };

  const handleCreateCustomer = async (data: AgencyCustomerRequest) => {
    if (!user?.agencyId) return;
    try {
      setModalLoading(true);
      await agencyCustomerService.createCustomer(user.agencyId, data);
      toast({
        title: "Succès",
        description: "Client créé avec succès",
      });
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la création du client",
        variant: "destructive"
      });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <PageHeader
        title="Gestion des Clients"
        description="Gérez vos clients et relations commerciales"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-3.5 h-3.5" />
              Exporter
            </Button>
            <Button 
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="gap-2"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Nouveau Client
            </Button>
          </div>
        }
      />

      <AgencyCustomerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCustomer}
        loading={modalLoading}
        title="Ajouter un Client"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={stats?.totalCustomers || 0} icon={TrendingUp} />
        <StatCard title="Clients Actifs" value={stats?.activeCustomers || 0} icon={ShieldCheck} />
        <StatCard title="Bloqués / Risque" value={stats?.blockedCustomers || 0} icon={AlertTriangle} />
        <StatCard title="Revenu Total" value={stats?.totalRevenue || 0} icon={Crown} suffix=" MAD" />
      </div>

      {/* Filters & Search */}
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par nom, email, téléphone ou entreprise..." 
                className="pl-9 h-10 bg-card border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="h-10 px-6">
                Rechercher
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold uppercase tracking-wide text-[10px] h-12">Client</TableHead>
              <TableHead className="text-muted-foreground font-semibold uppercase tracking-wide text-[10px] h-12">Contact</TableHead>
              <TableHead className="text-muted-foreground font-semibold uppercase tracking-wide text-[10px] h-12">Localisation</TableHead>
              <TableHead className="text-muted-foreground font-semibold uppercase tracking-wide text-[10px] h-12">Commandes</TableHead>
              <TableHead className="text-muted-foreground font-semibold uppercase tracking-wide text-[10px] h-12">Revenu</TableHead>
              <TableHead className="text-muted-foreground font-semibold uppercase tracking-wide text-[10px] h-12 text-center">Statut</TableHead>
              <TableHead className="text-muted-foreground font-semibold uppercase tracking-wide text-[10px] h-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b border-border">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j} className="h-16">
                      <Skeleton className="h-4 w-full bg-muted rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Search className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">Aucun client trouvé</p>
                    <Button variant="link" size="sm" className="text-primary text-xs" onClick={() => {setSearchQuery(''); fetchCustomers();}}>
                      Effacer les filtres
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id} className="border-b border-border hover:bg-muted/30 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-semibold text-primary text-xs shrink-0 uppercase">
                        {customer.fullName ? customer.fullName.split(' ').map(n => n[0]).join('') : '??'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground text-sm truncate">{customer.fullName}</span>
                          {customer.isVip && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                              </TooltipTrigger>
                              <TooltipContent>Client VIP</TooltipContent>
                            </Tooltip>
                          )}
                          {customer.isHighRisk && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                              </TooltipTrigger>
                              <TooltipContent>Client à Risque</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate">{customer.companyName || 'Client Individuel'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Mail className="w-3 h-3" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <MapPin className="w-3 h-3" />
                      {customer.city || 'Aucune ville'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-sm">{customer.totalOrders}</span>
                      <span className="text-[10px] text-muted-foreground">Réussite: {Math.round(customer.successRate * 100)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary text-sm">{customer.totalRevenue} MAD</span>
                      <span className="text-[10px] text-muted-foreground">30 derniers jours</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={customer.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-card border-border rounded-lg p-1">
                        <DropdownMenuLabel className="text-[10px] font-semibold uppercase text-muted-foreground px-3 py-2">Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="rounded-md gap-2 px-3 py-2 cursor-pointer text-xs" onClick={() => navigate(`/agency/customers/${customer.id}`)}>
                          <Eye className="w-3.5 h-3.5" />
                          Voir le Profil
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-md gap-2 px-3 py-2 cursor-pointer text-xs">
                          <Edit className="w-3.5 h-3.5" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {customer.status === 'ACTIVE' ? (
                          <>
                            <DropdownMenuItem className="rounded-md gap-2 px-3 py-2 cursor-pointer text-xs text-amber-600" onClick={() => handleStatusUpdate(customer.id, 'suspend')}>
                              <Ban className="w-3.5 h-3.5" />
                              Suspendre
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-md gap-2 px-3 py-2 cursor-pointer text-xs text-destructive" onClick={() => handleStatusUpdate(customer.id, 'block')}>
                              <Ban className="w-3.5 h-3.5" />
                              Bloquer
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem className="rounded-md gap-2 px-3 py-2 cursor-pointer text-xs text-emerald-600" onClick={() => handleStatusUpdate(customer.id, 'activate')}>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Réactiver
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="rounded-md gap-2 px-3 py-2 cursor-pointer text-xs text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AgencyCustomers;
