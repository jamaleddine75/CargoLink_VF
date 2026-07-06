import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AgencyWizard from './AgencyWizard';

const CreateAgency: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 font-sans selection:bg-blue-500/30 relative z-10 pb-8">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[5%] -left-[10%] w-[35%] h-[35%] bg-blue-600/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/agencies')}
            className="rounded-xl h-10 w-10 hover:bg-accent/20 dark:hover:bg-white/5 text-muted-foreground/40 dark:text-white/30 hover:text-foreground dark:hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-400">Admin · Agencies</p>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-foreground dark:text-white">
              Create <span className="text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">Agency</span>
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground dark:text-white/25 uppercase tracking-widest mt-1">New agency</p>
          </div>
        </div>
      </div>

      <AgencyWizard mode="create" />
    </div>
  );
};

export default CreateAgency;
