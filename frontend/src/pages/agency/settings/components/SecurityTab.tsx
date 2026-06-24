import React, { useState } from 'react';
import { Shield, Key, Smartphone, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SecurityTab: React.FC = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setPasswords({ current: '', new: '', confirm: '' });
      toast.success('Password updated successfully');
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Password Update Section */}
      <div className="bg-slate-900/30 border border-border/40 rounded-3xl p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Key className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-foreground mb-1">Change Password</h2>
            <p className="text-sm text-slate-400">Ensure your account is using a long, random password to stay secure.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="max-w-xl space-y-6">
          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-slate-300 ml-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={passwords.current}
                onChange={e => setPasswords({...passwords, current: e.target.value})}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all pr-12"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={passwords.new}
                onChange={e => setPasswords({...passwords, new: e.target.value})}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all pr-12"
                placeholder="Minimum 8 characters"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Confirm New Password</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={e => setPasswords({...passwords, confirm: e.target.value})}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
              placeholder="Confirm new password"
              required
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !passwords.current || !passwords.new || !passwords.confirm}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Auth Section */}
      <div className="bg-slate-900/30 border border-border/40 rounded-3xl p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Smartphone className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-foreground mb-1">Two-Factor Authentication</h2>
              <p className="text-sm text-slate-400">Add an extra layer of security to your account.</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Not Enabled
          </div>
        </div>

        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-sm text-slate-300 leading-relaxed max-w-xl">
            Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to log in.
          </div>
          <button className="whitespace-nowrap px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all border border-slate-700">
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityTab;
