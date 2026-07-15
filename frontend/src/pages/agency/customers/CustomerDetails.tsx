import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { agencyCustomerService, AgencyCustomer } from '@/services/api/agencyCustomerService';
import { 
  ArrowLeft, Mail, Phone, MapPin, TrendingUp, Package, 
  CheckCircle2, Crown, AlertTriangle, FileText, Activity, ShieldCheck 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, ResponsiveContainer 
} from 'recharts';

// Shared Components
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';

const revenueData = [
  { name: 'Sem 1', amount: 4000 },
  { name: 'Sem 2', amount: 3000 },
  { name: 'Sem 3', amount: 5000 },
  { name: 'Sem 4', amount: 8500 },
];

const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [customer, setCustomer] = useState<AgencyCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!user?.agencyId || !id) return;
      try {
        setLoading(true);
        const data = await agencyCustomerService.getCustomer(user.agencyId, id);
        setCustomer(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Unable to load customer details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [user?.agencyId, id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[300px] rounded-lg" />
          <Skeleton className="h-[300px] lg:col-span-2 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-muted-foreground">Client not found.</p>
        <Button onClick={() => navigate(-1)} className="mt-4" size="sm">Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
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
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-foreground">Client Profile: {customer.fullName}</h1>
            <StatusBadge status={customer.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            {customer.companyName || 'Individual Client'} • ID: {customer.id.substring(0, 8)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
            <CardHeader className="pb-0">
              <div className="flex justify-center py-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl font-semibold text-primary">
                    {customer.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  {customer.isVip && (
                    <div className="absolute -top-2.5 -right-2.5 w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center border-4 border-card">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <CardTitle className="text-center text-base font-semibold">{customer.fullName}</CardTitle>
              <CardDescription className="text-center text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                Since {new Date(customer.createdAt).toLocaleDateString('en-US')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase">Email</p>
                    <p className="text-xs font-medium text-foreground truncate">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase">Phone</p>
                    <p className="text-xs font-mono text-foreground truncate">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="w-8 h-8 rounded-md bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase">Address</p>
                    <p className="text-xs font-medium text-foreground truncate">{customer.address || 'No address'}, {customer.city}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Button className="w-full h-10 rounded-md font-semibold text-xs">Edit Profile</Button>
                <Button variant="outline" className="w-full h-10 rounded-md font-semibold text-xs border-border text-destructive hover:bg-destructive/5 hover:text-destructive">Suspend Client</Button>
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
            <CardHeader className="p-4 border-b border-border">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="p-4 rounded-lg bg-muted/40 border border-border italic text-xs text-muted-foreground">
                "{customer.notes || 'No internal notes for this client. Notes are only visible to administrators.'}"
              </div>
              <Button variant="link" className="text-primary text-[10px] font-semibold uppercase p-0 h-auto">Add/Edit Note</Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Revenue" value={customer.totalRevenue} icon={TrendingUp} suffix=" MAD" />
            <StatCard title="Total Orders" value={customer.totalOrders} icon={Package} />
            <StatCard title="Success Rate" value={Math.round(customer.successRate * 100)} icon={CheckCircle2} suffix="%" />
          </div>

          {/* Chart Section */}
          <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Revenue Overview</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Monthly performance tracking</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="text-[10px] font-semibold h-8 border-border">30 Days</Button>
                <Button size="sm" variant="outline" className="text-[10px] font-semibold h-8 text-muted-foreground border-transparent hover:border-border">90 Days</Button>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ fontSize: '11px', color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    itemStyle={{ color: 'hsl(var(--primary))', fontSize: '11px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Details Tabs */}
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="bg-muted p-1 rounded-lg w-full justify-start h-10 border border-border">
              <TabsTrigger value="orders" className="rounded-md px-6 text-xs font-semibold">Order History</TabsTrigger>
              <TabsTrigger value="activity" className="rounded-md px-6 text-xs font-semibold">Recent Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="mt-4">
              <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 flex items-center justify-between border-b border-border">
                    <p className="text-xs font-semibold text-foreground">Order History ({customer.totalOrders} shipments)</p>
                    <Button variant="link" className="text-primary text-xs font-semibold h-auto p-0">View Full List</Button>
                  </div>
                  <div className="divide-y divide-border">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">#ORD-2026-000{i+1}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Delivered on {10-i} May, 2026</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-foreground">145.00 MAD</p>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] mt-1 font-semibold px-2 py-0">COMPLETED</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden p-6">
                <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                  {[
                    { title: 'Account status updated', desc: 'Account activated by administrator', time: '2 hours ago', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
                    { title: 'Order delivered', desc: 'Order #ORD-2026-0001 delivered successfully', time: '5 hours ago', icon: CheckCircle2, color: 'text-primary bg-primary/10 border-primary/20' },
                    { title: 'Internal note added', desc: 'Follow-up note updated by agency', time: '1 day ago', icon: FileText, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
                  ].map((item, i) => (
                    <div key={i} className="relative pl-8">
                      <div className={cn("absolute left-0 top-0.5 w-6 h-6 rounded-md flex items-center justify-center border shrink-0", item.color)}>
                        <item.icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                        <p className="text-[9px] text-muted-foreground/60 mt-1">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
