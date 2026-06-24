import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import adminService from '@/services/api/adminService';
import { toast } from 'sonner';
import { Driver } from '@/types';

export interface ReassignmentModalProps {
  isOpen: boolean;
  orderId: string;
  currentDriver: Driver | null;
  availableDrivers: Driver[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ReassignmentModal: React.FC<ReassignmentModalProps> = ({
  isOpen,
  orderId,
  currentDriver,
  availableDrivers,
  onClose,
  onSuccess,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleReassign = async () => {
    if (!selectedDriverId || !reason.trim()) {
      toast.error('Please select a driver and provide a reason');
      return;
    }

    try {
      setLoading(true);
      await adminService.reassignOrder(orderId, selectedDriverId, reason, notes);
      toast.success('Order reassigned successfully');
      onSuccess();
      onClose();
      setSelectedDriverId('');
      setReason('');
      setNotes('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reassign order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h2 className="text-xl font-black tracking-tight">Reassign Order</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current Driver */}
          {currentDriver && (
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Current Driver</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {currentDriver.firstName?.[0]}{currentDriver.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-sm">{currentDriver.firstName} {currentDriver.lastName}</p>
                  <p className="text-xs text-slate-500">{currentDriver.phoneNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Alert */}
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Reassigning this order will create an audit trail and notify both drivers.
            </p>
          </div>

          {/* New Driver Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wider">
              New Driver
            </label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a driver...</option>
              {availableDrivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.firstName} {driver.lastName} ({driver.status})
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Reason for Reassignment *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select reason...</option>
              <option value="Driver unavailable">Driver Unavailable</option>
              <option value="Performance issues">Performance Issues</option>
              <option value="Distance optimization">Distance Optimization</option>
              <option value="Load balancing">Load Balancing</option>
              <option value="Customer request">Customer Request</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              placeholder="Enter any additional details..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReassign}
            disabled={loading || !selectedDriverId || !reason.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50"
          >
            {loading ? 'Reassigning...' : 'Reassign Order'}
          </button>
        </div>
      </div>
    </div>
  );
};
