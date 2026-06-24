import React from 'react';
import { CreditCard, Building2, Download, ExternalLink, CheckCircle2, History, Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import agencyService from '@/services/api/agencyService';

const BillingTab: React.FC = () => {
  const { data: payouts, isLoading, isError } = useQuery({
    queryKey: ['agency-payouts'],
    queryFn: () => agencyService.getPayoutRequests(),
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Plan */}
        <div className="bg-slate-900/30 border border-border/40 rounded-3xl p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-primary-foreground">Plan CargoLink</h2>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Actif
            </span>
          </div>

          <div className="mb-8">
            <div className="text-3xl font-black text-white mb-2">Agency Premium</div>
            <p className="text-sm text-slate-400">Accès complet à la plateforme, gestion de flotte illimitée et support prioritaire.</p>
          </div>

          <div className="space-y-3 mb-8">
            {['Chauffeurs illimités', 'Optimisation de routes IA', 'Tableau de bord multi-agences', 'Support Priority 24/7'].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {feature}
              </div>
            ))}
          </div>

          <button className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all border border-slate-700 flex items-center justify-center gap-2 group">
            Gérer l'abonnement <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Payout Methods */}
        <div className="bg-slate-900/30 border border-border/40 rounded-3xl p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-primary-foreground">Modes de Virement</h2>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-4 border border-blue-500/30 bg-blue-500/5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-slate-800 rounded flex items-center justify-center border border-slate-700">
                  <Building2 className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <div className="font-semibold text-white">Virement Bancaire (RIB)</div>
                  <div className="text-xs text-slate-400">Vérifié • Par défaut</div>
                </div>
              </div>
              <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Actif</span>
            </div>
          </div>

          <button className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
            + Ajouter un mode de virement
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-slate-900/30 border border-border/40 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
            <History className="w-5 h-5 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-primary-foreground">Historique des Virements</h2>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-slate-500">Chargement de l'historique...</p>
            </div>
          ) : isError ? (
            <div className="py-12 flex flex-col items-center gap-4 text-rose-500">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">Erreur lors de la récupération des données.</p>
            </div>
          ) : payouts?.length === 0 ? (
            <div className="py-12 text-center text-slate-500 italic">
              Aucun virement enregistré.
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Justificatif</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout: any, i: number) => (
                  <tr key={payout.id || i} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-4">{new Date(payout.createdAt).toLocaleDateString('fr-MA')}</td>
                    <td className="px-4 py-4 font-medium text-white">Virement de Commissions</td>
                    <td className="px-4 py-4">{payout.amount.toLocaleString('fr-MA')} MAD</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        payout.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        payout.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {payout.status === 'APPROVED' ? 'Payé' : payout.status === 'PENDING' ? 'En attente' : 'Rejeté'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-slate-700 rounded-lg">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingTab;
