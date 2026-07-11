import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  ArrowLeft, Package, MapPin, Clock, 
  User, Phone, Truck, MoreVertical, 
  Map as MapIcon, QrCode, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SecureImage } from '@/components/common/SecureImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import agencyService from '@/services/api/agencyService';

// Shared Components
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';

export default function AgencyOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ['agency-order', id],
    queryFn: () => agencyService.getOrderById(id!),
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] md:col-span-2 rounded-lg" />
          <Skeleton className="h-[400px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <h2 className="text-base font-semibold">Impossible de charger les détails de la commande</h2>
        <p className="text-xs text-muted-foreground">{(error as any)?.message || 'Une erreur est survenue.'}</p>
        <Button onClick={() => navigate(-1)} variant="outline" size="sm">
          Retour
        </Button>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-md border-border bg-card shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold text-foreground">Détails de l'Expédition</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              N° de suivi : <span className="font-mono text-foreground font-semibold">{order.trackingNumber}</span> • Créé le {format(new Date(order.createdAt), 'dd MMM yyyy HH:mm')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border" onClick={() => toast.info('Fonctionnalité disponible bientôt')}>
            <MapIcon className="w-4 h-4 mr-1.5" />
            Suivi en direct
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 border-border">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border-border">
              <DropdownMenuItem onClick={() => window.print()}>Imprimer le reçu</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Annuler l'expédition</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary Card */}
          <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
            <CardHeader className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base font-semibold">Récapitulatif de la Commande</CardTitle>
                </div>
                {order.urgent && (
                  <Badge variant="destructive" className="text-[10px] px-2 py-0.5 font-semibold">
                    Prioritaire
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Point d'enlèvement</span>
                  <div className="flex gap-2">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-foreground">{order.pickupAddress}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Destination de livraison</span>
                  <div className="flex gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-foreground">{order.deliveryAddress}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Distance</span>
                  <p className="text-sm font-semibold">{order.distance?.toFixed(1) || '0'} KM</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Montant COD</span>
                  <p className="text-sm font-semibold text-primary">{order.codAmount?.toLocaleString() || '0'} MAD</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Frais de livraison</span>
                  <p className="text-sm font-semibold text-foreground">{order.deliveryFee?.toLocaleString() || '0'} MAD</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Paiement</span>
                  <div>
                    <Badge variant="outline" className={order.codCollected ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}>
                      {order.codCollected ? 'Réglé' : 'En attente COD'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Section */}
          <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
            <CardHeader className="p-6 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold">Historique de Suivi</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative space-y-6 pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                {/* Order Created */}
                <div className="relative">
                  <div className="absolute -left-7 top-1 w-3.5 h-3.5 rounded-full border-2 border-primary bg-background z-10" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Commande Créée</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(order.createdAt), 'dd MMM yyyy · HH:mm')}</p>
                  </div>
                </div>

                {/* Order Assigned */}
                {order.assignedAt && (
                  <div className="relative">
                    <div className="absolute -left-7 top-1 w-3.5 h-3.5 rounded-full border-2 border-primary bg-background z-10" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">Chauffeur Assigné</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(order.assignedAt), 'dd MMM yyyy · HH:mm')}</p>
                    </div>
                  </div>
                )}

                {/* Delivery Started */}
                {order.deliveryStartedDate && (
                  <div className="relative">
                    <div className="absolute -left-7 top-1 w-3.5 h-3.5 rounded-full border-2 border-primary bg-background z-10" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">Livraison en Cours</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(order.deliveryStartedDate), 'dd MMM yyyy · HH:mm')}</p>
                    </div>
                  </div>
                )}

                {/* Delivered */}
                {order.deliveredDate && (
                  <div className="relative">
                    <div className="absolute -left-7 top-1 w-3.5 h-3.5 rounded-full border-2 border-emerald-500 bg-background z-10" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-emerald-600">Livraison Effectuée</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(order.deliveredDate), 'dd MMM yyyy · HH:mm')}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Info Column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
            <CardHeader className="p-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-semibold">Destinataire</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-sm font-semibold uppercase">
                  {order.receiverName?.charAt(0) || 'C'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{order.receiverName}</p>
                  <p className="text-[10px] text-muted-foreground">Destinataire</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-mono">{order.receiverPhone}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted" asChild>
                  <a href={`tel:${order.receiverPhone}`}>
                    <Phone className="w-3.5 h-3.5 text-primary" />
                  </a>
                </Button>
              </div>
              
              <Separator className="bg-border" />
              
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Expéditeur / Client</span>
                <p className="text-xs font-semibold text-foreground">{order.clientName || 'Client Standard'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Driver Info */}
          <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
            <CardHeader className="p-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Truck className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-semibold">Chauffeur Assigné</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {order.driverName ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border overflow-hidden">
                      {order.driverAvatarUrl ? (
                        <SecureImage fileEndpoint={order.driverAvatarUrl} alt={order.driverName} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{order.driverName}</p>
                      <p className="text-[10px] text-muted-foreground">{order.vehicleNumber || 'Plaque indisponible'}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full border-border">
                    <Phone className="w-3.5 h-3.5 mr-1.5" />
                    Contacter le Chauffeur
                  </Button>
                </div>
              ) : (
                <div className="py-4 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Truck className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-muted-foreground">Aucun Chauffeur Assigné</p>
                    <p className="text-[10px] text-muted-foreground/60 px-4">Cette commande est en attente d'assignation.</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full border-border">
                    Assigner
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions / Proof */}
          <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <QrCode className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Preuve de Livraison</span>
              </div>
              {order.deliveryProofPhotoUrl ? (
                <div className="aspect-video rounded-lg border border-border overflow-hidden relative group">
                  <SecureImage fileEndpoint={order.deliveryProofPhotoUrl} alt="Preuve" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" className="font-semibold text-xs rounded-md">Agrandir</Button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center border border-dashed border-border rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Aucun justificatif disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
