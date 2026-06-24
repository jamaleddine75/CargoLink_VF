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
import { motion, AnimatePresence } from 'framer-motion';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const AgencyCustomers = () => {
  const [customers, setCustomers] = useState<AgencyCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);
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
      console.log(`[AgencyCustomers] Initiating fetch for agencyId: ${user.agencyId}`);
      
      const response = await agencyCustomerService.getCustomers(user.agencyId, searchQuery);
      console.log("[AgencyCustomers] CUSTOMERS API RESPONSE:", response);

      // Deeply unwrap the customer list
      let customerList: AgencyCustomer[] = [];
      
      if (Array.isArray(response)) {
        customerList = response;
      } else if (response && typeof response === 'object') {
        // Priority 1: Direct content (Spring Page)
        if (Array.isArray(response.content)) customerList = response.content;
        // Priority 2: Generic data array
        else if (Array.isArray(response.data)) customerList = response.data;
        // Priority 3: Nested data.content (Spring ApiResponse + Page)
        else if (response.data && Array.isArray(response.data.content)) customerList = response.data.content;
        // Priority 4: Other common keys
        else if (Array.isArray(response.items)) customerList = response.items;
        else if (Array.isArray(response.result)) customerList = response.result;
        // Priority 5: Fallback if the object itself has no obvious array but we might be missing something
        else {
          console.warn("[AgencyCustomers] No array found in customer response keys. Searching object for first array...");
          const firstArray = Object.values(response).find(v => Array.isArray(v));
          if (firstArray) customerList = firstArray as AgencyCustomer[];
        }
      }
      
      console.log(`[AgencyCustomers] Resolved Customer List (Count: ${customerList.length})`);
      if (customerList.length > 0) console.table(customerList.slice(0, 5));
      setCustomers(customerList);
      
      const analytics = await agencyCustomerService.getAnalytics(user.agencyId);
      console.log("[AgencyCustomers] ANALYTICS API RESPONSE:", analytics);
      
      // Defensive mapping for analytics stats
      if (analytics && typeof analytics === 'object') {
        // If the backend wraps the Map in an ApiResponse object
        const statsData = analytics.data || analytics.result || analytics;
        console.log("[AgencyCustomers] Resolved Stats Data:", statsData);
        setStats(statsData);
      }
    } catch (error: any) {
      console.error("[AgencyCustomers] Fetch Error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load customers",
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
        title: "Success",
        description: `Customer ${status}d successfully`,
      });
      fetchCustomers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update customer status",
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
        title: "Success",
        description: "Customer created successfully",
      });
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive"
      });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#020617] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-black tracking-tight text-white uppercase">Customer Management</h1>
          <p className="text-white/40 mt-2 text-sm tracking-widest font-medium uppercase">Manage your business clients and relationships</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2 h-12 px-6 rounded-2xl transition-all">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2 h-12 px-6 rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus className="w-4 h-4" />
            New Customer
          </Button>
        </motion.div>
      </div>

      <AgencyCustomerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCustomer}
        loading={modalLoading}
        title="Add New Customer"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Customers', value: stats?.totalCustomers || 0, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Active Clients', value: stats?.activeCustomers || 0, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Blocked / Risk', value: stats?.blockedCustomers || 0, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: 'Total Revenue', value: `${stats?.totalRevenue || 0} MAD`, icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-3xl overflow-hidden hover:bg-white/[0.04] transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{stat.label}</p>
                    <p className="text-2xl font-black text-white mt-1 tracking-tighter">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <Input 
                placeholder="Search by name, email, phone or company..." 
                className="bg-white/5 border-white/10 text-white pl-12 h-12 rounded-2xl focus:ring-blue-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 h-12 px-8 rounded-2xl">
                Search
              </Button>
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 h-12 w-12 p-0 rounded-2xl">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-white/5 border-b border-white/5">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-white/40 font-black uppercase tracking-widest text-[10px] h-14">Customer</TableHead>
              <TableHead className="text-white/40 font-black uppercase tracking-widest text-[10px] h-14">Contact</TableHead>
              <TableHead className="text-white/40 font-black uppercase tracking-widest text-[10px] h-14">Business</TableHead>
              <TableHead className="text-white/40 font-black uppercase tracking-widest text-[10px] h-14">Orders</TableHead>
              <TableHead className="text-white/40 font-black uppercase tracking-widest text-[10px] h-14">Revenue</TableHead>
              <TableHead className="text-white/40 font-black uppercase tracking-widest text-[10px] h-14 text-center">Status</TableHead>
              <TableHead className="text-white/40 font-black uppercase tracking-widest text-[10px] h-14 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-white/5">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j} className="h-20">
                      <Skeleton className="h-4 w-full bg-white/5 rounded-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <Search className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/40 font-medium tracking-wider uppercase text-xs">No customers found matching your criteria</p>
                    <Button variant="link" className="text-blue-500 uppercase text-[10px] font-black tracking-widest" onClick={() => {setSearchQuery(''); fetchCustomers();}}>Clear all filters</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center font-black text-blue-500 shrink-0 uppercase">
                        {customer.fullName ? customer.fullName.split(' ').map(n => n[0]).join('') : '??'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate group-hover:text-blue-400 transition-colors">{customer.fullName}</span>
                          {customer.isVip && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                              </TooltipTrigger>
                              <TooltipContent>VIP Customer</TooltipContent>
                            </Tooltip>
                          )}
                          {customer.isHighRisk && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                              </TooltipTrigger>
                              <TooltipContent>High Risk Customer</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <span className="text-[10px] text-white/30 truncate">{customer.companyName || 'Individual Client'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-white/60 text-xs">
                        <Mail className="w-3 h-3" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-white/60 text-xs">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-white/60 text-xs">
                        <MapPin className="w-3 h-3" />
                        {customer.city || 'No City'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{customer.totalOrders}</span>
                      <span className="text-[10px] text-white/30 uppercase tracking-widest">Successful: {Math.round(customer.successRate * 100)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-emerald-400">{customer.totalRevenue} MAD</span>
                      <span className="text-[10px] text-white/30 uppercase tracking-widest">Last 30 days</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "uppercase text-[9px] font-black tracking-[0.15em] px-3 py-1 rounded-full",
                      customer.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                      customer.status === 'SUSPENDED' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                      "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    )}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white/10 text-white/40 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-[#0f172a] border-white/10 text-white rounded-2xl p-2 shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-white/30 px-3 py-2">Management Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="rounded-xl focus:bg-blue-600 focus:text-white gap-3 p-3 cursor-pointer" onClick={() => navigate(`/agency/customers/${customer.id}`)}>
                          <Eye className="w-4 h-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl focus:bg-white/10 gap-3 p-3 cursor-pointer">
                          <Edit className="w-4 h-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        {customer.status === 'ACTIVE' ? (
                          <>
                            <DropdownMenuItem className="rounded-xl focus:bg-amber-500/20 focus:text-amber-500 gap-3 p-3 cursor-pointer" onClick={() => handleStatusUpdate(customer.id, 'suspend')}>
                              <Ban className="w-4 h-4" />
                              Suspend Account
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl focus:bg-rose-500/20 focus:text-rose-500 gap-3 p-3 cursor-pointer" onClick={() => handleStatusUpdate(customer.id, 'block')}>
                              <Ban className="w-4 h-4" />
                              Block Client
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem className="rounded-xl focus:bg-emerald-500/20 focus:text-emerald-500 gap-3 p-3 cursor-pointer" onClick={() => handleStatusUpdate(customer.id, 'activate')}>
                            <ShieldCheck className="w-4 h-4" />
                            Re-activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="rounded-xl focus:bg-rose-500 focus:text-white gap-3 p-3 text-rose-500 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                          Delete Customer
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
