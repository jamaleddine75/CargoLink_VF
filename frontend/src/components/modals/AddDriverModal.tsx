import React, { useState } from 'react';
import { X, UserPlus, Mail, Phone, Car, Hash, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDriverAdded: () => void;
  agencyId: string;
}

export default function AddDriverModal({ isOpen, onClose, onDriverAdded, agencyId }: AddDriverModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    vehiclePlate: '',
    vehicleType: 'MOTO'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // We assume a dedicated endpoint to create a driver within an agency exists or use the admin driver creation
      await apiClient.post(ENDPOINTS.AUTH.REGISTER.replace('/register', '/register-driver'), {
        ...formData,
        password: 'Password123!', // Default password, can be changed later
        agencyId
      });
      toast.success('Driver added successfully!');
      onDriverAdded();
      onClose();
    } catch (error: unknown) {
      toast.error(error.response?.data?.message || 'Error adding driver');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-white dark:bg-slate-900 border-none shadow-2xl rounded-3xl overflow-hidden ring-1 ring-slate-200/50 dark:ring-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">New Driver</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile Creation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">First Name</label>
              <div className="relative">
                <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full h-12 pl-4 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm" placeholder="Ex: Ahmed" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Last Name</label>
              <div className="relative">
                <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full h-12 pl-4 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm" placeholder="Ex: Benali" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm" placeholder="ahmed@example.com" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input required name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm" placeholder="+212 600 000 000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">License Plate</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input required name="vehiclePlate" value={formData.vehiclePlate} onChange={handleChange} className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm uppercase" placeholder="12345-A-6" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vehicle Type</label>
              <div className="relative">
                <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select required name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm appearance-none">
                  <option value="MOTO">Motorcycle</option>
                  <option value="CAR">Car</option>
                  <option value="VAN">Van</option>
                  <option value="TRUCK">Truck</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20 flex gap-3 mt-4">
            <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              A temporary password will be generated and an invitation email will be sent to the driver with login instructions.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold uppercase text-xs tracking-widest">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-600/20">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Driver'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
