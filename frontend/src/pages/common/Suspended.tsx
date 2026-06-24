import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, LogOut, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SuspendedPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl text-center"
      >
        <div className="w-20 h-20 rounded-[2rem] bg-red-500/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10 border border-red-500/20">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-black tracking-tighter text-white mb-2">Account Suspended</h1>
        <p className="text-slate-400 font-medium mb-8">
          Your account has been suspended by the administration. <br />
          <span className="text-red-400">Contact support to resolve this issue.</span>
        </p>

        <div className="space-y-3">
          <Button 
            className="w-full h-12 rounded-2xl bg-white text-black hover:bg-white/90 font-bold transition-all"
            onClick={() => window.location.href = 'mailto:support@cargolink.com'}
          >
            <MessageCircle className="w-4 h-4 mr-2" /> Contact Support
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full h-12 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold transition-all"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Return to Login
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-[10px] uppercase font-black tracking-widest text-slate-500">
          CargoLink Security System
        </div>
      </motion.div>
    </div>
  );
};

export default SuspendedPage;
