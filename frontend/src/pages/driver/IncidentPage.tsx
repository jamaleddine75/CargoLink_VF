import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

const INCIDENT_CATEGORIES: { value: string; label: string }[] = [
  { value: 'CUSTOMER_ABSENT', label: 'Client absent' },
  { value: 'ADDRESS_UNREACHABLE', label: 'Adresse inaccessible' },
  { value: 'PACKAGE_DAMAGED', label: 'Colis endommagé' },
  { value: 'VEHICLE_BREAKDOWN', label: 'Panne de véhicule' },
  { value: 'REFUSED_DELIVERY', label: 'Livraison refusée par le client' },
  { value: 'OTHER', label: 'Autre' },
];

const IncidentPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const isDriver = isAuthenticated && user?.role === 'DRIVER';

  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isDriver) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-black mb-2">Accès refusé</h1>
        <p className="text-muted-foreground mb-8">Cette page est réservée aux chauffeurs.</p>
        <Button variant="outline" onClick={() => navigate('/driver/dashboard')}>
          Retour au Dashboard
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
        <h1 className="text-2xl font-black mb-2">Incident signalé</h1>
        <p className="text-muted-foreground mb-8">
          Votre rapport a été transmis avec succès. L'équipe en charge vous contactera si nécessaire.
        </p>
        <Button variant="outline" className="rounded-xl font-bold" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast.error('Veuillez sélectionner un type d\'incident');
      return;
    }
    if (description.trim().length < 20) {
      toast.error('La description doit contenir au moins 20 caractères');
      return;
    }
    if (!id) {
      toast.error('Identifiant de mission manquant');
      return;
    }
    try {
      setSubmitting(true);
      await apiClient.post(ENDPOINTS.ORDERS.REPORT_PROBLEM(id), { category, description: description.trim() });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err?.response?.data?.message || 'Erreur lors du signalement. Réessayez.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-md bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-black tracking-tight">Signaler un incident</h1>
          </div>
          {id && (
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">
              Mission #{id.slice(0, 8).toUpperCase()}
            </p>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-sm font-black text-foreground">Détails de l'incident</h2>
          <p className="text-xs text-muted-foreground mt-1">Décrivez le problème rencontré. Un responsable sera alerté immédiatement.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="category" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Type d'incident <span className="text-destructive">*</span>
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="h-11 rounded-md border-border">
                <SelectValue placeholder="Sélectionner un type..." />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Description <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="description"
              placeholder="Décrivez le problème en détail (min. 20 caractères)..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="min-h-[140px] rounded-md resize-none border-border"
              maxLength={1000}
            />
            <p className={`text-xs text-right font-medium ${description.length < 20 && description.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {description.length}/1000{description.length < 20 && description.length > 0 && ` — encore ${20 - description.length} car.`}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="flex-1 h-11 rounded-md bg-muted border border-border font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
              disabled={submitting || !category || description.trim().length < 20}
            >
              {submitting ? 'Envoi...' : "Signaler l'incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentPage;
