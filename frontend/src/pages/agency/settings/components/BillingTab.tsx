import React from 'react';
import { CreditCard, Building2, Download, ExternalLink, CheckCircle2, History, Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import agencyService from '@/services/api/agencyService';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from '@/components/shared/StatusBadge';
import { 
  DataTable, 
  DataTableHeader, 
  DataTableBody, 
  DataTableRow, 
  DataTableHead, 
  DataTableCell 
} from '@/components/shared/DataTable';

const BillingTab: React.FC = () => {
  const { data: payouts, isLoading, isError } = useQuery({
    queryKey: ['agency-payouts'],
    queryFn: () => agencyService.getPayoutRequests(),
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan */}
        <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-base font-semibold text-foreground">Abonnement CargoLink</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wide">
                Actif
              </span>
            </div>

            <div>
              <div className="text-2xl font-bold text-foreground">Agency Premium</div>
              <p className="text-xs text-muted-foreground mt-1">Accès complet à la plateforme, gestion de flotte illimitée et support prioritaire.</p>
            </div>

            <div className="space-y-2">
              {['Chauffeurs illimités', 'Optimisation de routes IA', 'Tableau de bord multi-agences', 'Support Priority 24/7'].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" className="w-full gap-2 border-border">
              Gérer l'abonnement <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Payout Methods */}
        <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Modes de Virement</h2>
            </div>

            <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-7 bg-muted rounded flex items-center justify-center border border-border shrink-0">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-foreground text-xs truncate">Virement Bancaire (RIB)</div>
                  <div className="text-[10px] text-muted-foreground">Vérifié • Par défaut</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-primary bg-primary/15 px-2 py-0.5 rounded">Actif</span>
            </div>

            <Button size="sm" className="w-full">
              + Ajouter un mode de virement
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-muted rounded-lg border border-border">
              <History className="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Historique des Virements</h2>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground">Chargement de l'historique...</p>
              </div>
            ) : isError ? (
              <div className="py-12 flex flex-col items-center gap-3 text-destructive">
                <AlertCircle className="w-6 h-6" />
                <p className="text-xs">Erreur lors de la récupération des données.</p>
              </div>
            ) : !Array.isArray(payouts) || payouts.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground italic border border-dashed rounded-lg">
                Aucun virement enregistré.
              </div>
            ) : (
              <DataTable>
                <DataTableHeader>
                  <DataTableRow hover={false}>
                    <DataTableHead className="pl-4">Date</DataTableHead>
                    <DataTableHead>Description</DataTableHead>
                    <DataTableHead>Montant</DataTableHead>
                    <DataTableHead>Statut</DataTableHead>
                    <DataTableHead className="pr-4 text-right">Justificatif</DataTableHead>
                  </DataTableRow>
                </DataTableHeader>
                <DataTableBody>
                  {payouts.map((payout: any, i: number) => (
                    <DataTableRow key={payout.id || i}>
                      <DataTableCell className="pl-4 py-3.5 text-xs text-muted-foreground">
                        {new Date(payout.createdAt).toLocaleDateString('fr-MA')}
                      </DataTableCell>
                      <DataTableCell className="py-3.5 font-semibold text-foreground text-xs">
                        Virement de Commissions
                      </DataTableCell>
                      <DataTableCell className="py-3.5 text-xs text-foreground font-semibold">
                        {payout.amount.toLocaleString('fr-MA')} MAD
                      </DataTableCell>
                      <DataTableCell className="py-3.5">
                        <StatusBadge status={payout.status} />
                      </DataTableCell>
                      <DataTableCell className="pr-4 py-3.5 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Download className="w-4 h-4" />
                        </Button>
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingTab;
