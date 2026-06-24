import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Package, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Crown,
  FileText,
  Activity,
  CreditCard,
  History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { agencyCustomerService, AgencyCustomer } from '@/services/api/agencyCustomerService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<AgencyCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
          description: "Failed to load customer details",
          variant: "destructive"
        });
        navigate('/agency/customers');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, user?.agencyId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) return null;

  // Mock data for charts
  const revenueData = [
    { name: 'Week 1', amount: 4500 },
    { name: 'Week 2', amount: 5200 },
    { name: 'Week 3', amount: 4800 },
    { name: 'Week 4', amount: 6100 },
    { name: 'Week 5', amount: 5900 },
    { name: 'Week 6', amount: 7200 },
  ];

  return (
    <div className="p-8 space-y-8 bg-[#020617] min-h-screen text-white">
      {/* Back & Title */}
      <div className="flex items-center gap-6">
        <Button 
          variant="ghost" 
          className="h-12 w-12 p-0 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white"
          onClick={() => navigate('/agency/customers')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">{customer.fullName}</h1>
            <Badge className={cn(
              "uppercase text-[9px] font-black tracking-[0.15em] px-3 py-1 rounded-full",
              customer.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
              customer.status === 'SUSPENDED' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
              "bg-rose-500/10 text-rose-500 border border-rose-500/20"
            )}>
              {customer.status}
            </Badge>
          </div>
          <p className="text-white/40 text-sm font-medium uppercase tracking-widest mt-1">
            {customer.companyName || 'Private Client'} • Customer ID: {customer.id.substring(0, 8)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="space-y-8">
          <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardHeader className="pb-0">
              <div className="flex justify-center py-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-4xl font-black text-white shadow-2xl">
                    {customer.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  {customer.isVip && (
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg border-4 border-[#020617]">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <CardTitle className="text-center text-xl font-bold">{customer.fullName}</CardTitle>
              <CardDescription className="text-center text-white/40 uppercase tracking-widest text-[10px] font-black">
                Since {new Date(customer.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Email Address</p>
                    <p className="text-sm font-medium truncate">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Phone Number</p>
                    <p className="text-sm font-medium truncate">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Location</p>
                    <p className="text-sm font-medium truncate">{customer.address || 'No address'}, {customer.city}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <Button className="w-full bg-blue-600 hover:bg-blue-500 h-12 rounded-2xl font-bold">Edit Profile</Button>
                <Button variant="outline" className="w-full border-white/10 bg-transparent h-12 rounded-2xl font-bold text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20">Suspend Customer</Button>
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-white/40" />
                Internal Agency Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 italic text-white/60 text-sm">
                "{customer.notes || 'No internal notes added for this customer yet. Notes are only visible to agency admins.'}"
              </div>
              <Button variant="link" className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-4 p-0">Add/Update Note</Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats & Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Total Revenue', value: `${customer.totalRevenue} MAD`, icon: TrendingUp, color: 'text-emerald-500', trend: '+12% this month' },
              { label: 'Total Orders', value: customer.totalOrders, icon: Package, color: 'text-blue-500', trend: 'Average 5/week' },
              { label: 'Success Rate', value: `${Math.round(customer.successRate * 100)}%`, icon: CheckCircle2, color: 'text-amber-500', trend: 'Above average' },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-3xl overflow-hidden">
                  <CardContent className="p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{kpi.label}</p>
                    <div className="flex items-end justify-between mt-2">
                      <p className="text-3xl font-black tracking-tighter">{kpi.value}</p>
                      <kpi.icon className={cn("w-6 h-6 mb-1", kpi.color)} />
                    </div>
                    <p className="text-[10px] text-white/40 mt-4 flex items-center gap-1 font-medium">
                      <Activity className="w-3 h-3 text-emerald-500" />
                      {kpi.trend}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Chart Section */}
          <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Revenue Insights</CardTitle>
                <p className="text-xs text-white/40 uppercase font-black tracking-widest mt-1">Weekly performance tracking</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-[10px] font-black uppercase tracking-widest rounded-xl bg-white/5 border-white/10 h-8">30 Days</Button>
                <Button size="sm" variant="outline" className="text-[10px] font-black uppercase tracking-widest rounded-xl bg-transparent border-white/5 text-white/40 h-8">90 Days</Button>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#ffffff40', fontWeight: 'bold' }}
                  />
                  <YAxis 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#ffffff40', fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#2563eb" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Details Tabs */}
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl w-full justify-start gap-2 h-14">
              <TabsTrigger value="orders" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white uppercase text-[10px] font-black tracking-widest transition-all">Order History</TabsTrigger>
              <TabsTrigger value="activity" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white uppercase text-[10px] font-black tracking-widest transition-all">Recent Activity</TabsTrigger>
              <TabsTrigger value="billing" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white uppercase text-[10px] font-black tracking-widest transition-all">Billing & COD</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="mt-6">
              <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-8 flex items-center justify-between border-b border-white/5">
                    <p className="text-sm font-bold">Total History ({customer.totalOrders} Orders)</p>
                    <Button variant="link" className="text-blue-500 text-[10px] font-black uppercase tracking-widest">View Full List</Button>
                  </div>
                  <div className="divide-y divide-white/5">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-blue-600/20 group-hover:text-blue-500 transition-colors">
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-bold">#ORD-2026-000{i+1}</p>
                            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Delivered on May {10-i}, 2026</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-400">145.00 MAD</p>
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-none uppercase text-[8px] mt-1 font-black">COMPLETED</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-3xl overflow-hidden p-8">
                <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                  {[
                    { title: 'Status Updated', desc: 'Account was activated by Admin', time: '2 hours ago', icon: ShieldCheck, color: 'bg-emerald-500' },
                    { title: 'Order Completed', desc: 'Order #ORD-2026-0001 delivered', time: '5 hours ago', icon: CheckCircle2, color: 'bg-blue-500' },
                    { title: 'New Note Added', desc: 'Internal note updated by Agency Admin', time: '1 day ago', icon: FileText, color: 'bg-amber-500' },
                  ].map((item, i) => (
                    <div key={i} className="relative pl-12">
                      <div className={cn("absolute left-0 top-0 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg", item.color)}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{item.title}</p>
                        <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                        <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mt-2">{item.time}</p>
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
