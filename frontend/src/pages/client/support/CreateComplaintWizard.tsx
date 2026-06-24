import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Package, 
  AlertTriangle, 
  Camera, 
  Upload,
  CheckCircle,
  Clock,
  MapPin,
  User,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '@/api/client';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface Order {
  id: string;
  trackingNumber: string;
  status: string;
  createdAt: string;
  driverName?: string;
  destinationCity?: string;
}

interface WizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateComplaintWizard = ({ onClose, onSuccess }: WizardProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [incidentType, setIncidentType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiClient.get('/api/client/support/orders');
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => 
    order.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const incidentTypes = [
    { id: 'DAMAGED_PACKAGE', label: 'Damaged Package', icon: ShieldCheck, color: 'text-rose-500' },
    { id: 'MISSING_PACKAGE', label: 'Missing Package', icon: AlertTriangle, color: 'text-amber-500' },
    { id: 'LATE_DELIVERY', label: 'Late Delivery', icon: Clock, color: 'text-blue-500' },
    { id: 'WRONG_DELIVERY', label: 'Wrong Delivery', icon: MapPin, color: 'text-purple-500' },
    { id: 'PAYMENT_ISSUE', label: 'Payment/COD Issue', icon: Package, color: 'text-emerald-500' },
    { id: 'DRIVER_BEHAVIOR', label: 'Driver Behavior', icon: User, color: 'text-slate-500' },
    { id: 'OTHER', label: 'Other Issue', icon: Search, color: 'text-muted-foreground' },
  ];

  const handleSubmit = async () => {
    if (!selectedOrder || !incidentType || !title || !description) return;

    try {
      setLoading(true);
      await apiClient.post('/api/client/support/incidents', {
        orderId: selectedOrder.id,
        category: incidentType,
        title,
        description,
        priority
      });

      toast({
        title: "Incident Reported",
        description: "Your support ticket has been created successfully.",
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating incident:', error);
      toast({
        title: "Submission Failed",
        description: "Could not create your support ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-[#020617] border border-white/5 w-full max-w-2xl rounded-[2.5rem] shadow-2xl shadow-black relative overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-xl">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase text-white">Report an Issue</h2>
            <p className="text-muted-foreground text-sm font-medium">Step {step} of 4</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="rounded-full bg-white/5 hover:bg-white/10"
          >
            <X className="w-5 h-5 text-white" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-white/5 overflow-hidden">
          <motion.div 
            className="h-full bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* STEP 1: SELECT ORDER */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Select your order</h3>
                  <p className="text-muted-foreground text-sm font-medium">Which delivery are you having trouble with?</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by tracking number..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl"
                  />
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {ordersLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                    ))
                  ) : filteredOrders.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-muted-foreground bg-white/5 rounded-3xl border border-dashed border-white/10">
                      <Package className="w-8 h-8 opacity-20 mb-2" />
                      <p className="text-xs font-black uppercase tracking-widest">No orders found</p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <div 
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                          selectedOrder?.id === order.id 
                            ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' 
                            : 'bg-white/5 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            selectedOrder?.id === order.id ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground group-hover:text-white'
                          }`}>
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black text-white uppercase tracking-tight">{order.trackingNumber}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                              {format(new Date(order.createdAt), 'MMM dd, yyyy')} • {order.destinationCity || 'Morocco'}
                            </p>
                          </div>
                        </div>
                        {selectedOrder?.id === order.id && (
                          <CheckCircle className="w-6 h-6 text-primary animate-in zoom-in" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 2: INCIDENT TYPE */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">What happened?</h3>
                  <p className="text-muted-foreground text-sm font-medium">Select the category that best describes your issue.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {incidentTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setIncidentType(type.id)}
                      className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 text-left ${
                        incidentType === type.id 
                          ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' 
                          : 'bg-white/5 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <type.icon className={`w-6 h-6 ${incidentType === type.id ? 'text-primary' : type.color}`} />
                      <span className="font-black text-xs uppercase tracking-widest text-white">{type.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: DETAILS */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Tell us more</h3>
                  <p className="text-muted-foreground text-sm font-medium">Provide as much detail as possible to help us resolve this.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Ticket Title</label>
                    <Input 
                      placeholder="Briefly summarize the issue..." 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-12 bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Detailed Description</label>
                    <Textarea 
                      placeholder="Describe what happened in detail..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[120px] bg-white/5 border-white/10 rounded-xl resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Priority (Optional)</label>
                       <select 
                         value={priority}
                         onChange={(e) => setPriority(e.target.value)}
                         className="w-full h-12 bg-[#1e293b] border-white/10 rounded-xl text-white px-4 text-sm outline-none focus:ring-2 ring-primary/20"
                       >
                         <option value="LOW">Low - Normal Inquiry</option>
                         <option value="MEDIUM">Medium - Needs Attention</option>
                         <option value="HIGH">High - Urgent Issue</option>
                         <option value="CRITICAL">Critical - Immediate Action</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Attachments</label>
                       <Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-white/10 bg-white/5 flex items-center gap-2">
                         <Upload className="w-4 h-4" />
                         <span>Upload Proof</span>
                       </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: REVIEW */}
            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Final Review</h3>
                  <p className="text-muted-foreground text-sm font-medium">Please confirm the details before submitting.</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Order</span>
                    <span className="font-bold text-white uppercase">{selectedOrder?.trackingNumber}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Issue Type</span>
                    <Badge variant="outline" className="text-primary border-primary/20 uppercase font-black tracking-tighter">
                      {incidentType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Summary</span>
                    <p className="text-white font-bold">{title}</p>
                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{description}</p>
                  </div>
                </div>

                <Card className="p-4 bg-primary/10 border-primary/20 rounded-2xl flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-[10px] text-primary-foreground/80 leading-relaxed">
                    By submitting, our support team will be notified immediately. We aim to respond within 24 hours.
                  </p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-white/5 bg-white/5 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={step === 1 ? onClose : prevStep}
            className="rounded-xl h-12 px-6 font-bold uppercase tracking-widest text-[10px] hover:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < 4 ? (
            <Button 
              disabled={
                (step === 1 && !selectedOrder) || 
                (step === 2 && !incidentType) ||
                (step === 3 && (!title || !description))
              }
              onClick={nextStep}
              className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 rounded-xl flex items-center gap-2 group transition-all"
            >
              Next Step
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          ) : (
            <Button 
              disabled={loading}
              onClick={handleSubmit}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 px-10 rounded-xl shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-[0.2em] text-[10px]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Submit Ticket'
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreateComplaintWizard;
