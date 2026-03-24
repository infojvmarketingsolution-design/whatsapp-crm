import React from 'react';
import { Hammer, Clock, ShieldCheck } from 'lucide-react';

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full">
        <div className="mb-8 relative inline-block">
            <div className="p-6 bg-blue-500/10 rounded-full animate-pulse">
                <Hammer size={64} className="text-blue-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 bg-slate-800 rounded-lg border border-slate-700">
                <Clock size={20} className="text-blue-400" />
            </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">System Maintenance</h1>
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
          We're currently performing some scheduled upgrades to improve your experience. We'll be back online shortly!
        </p>
        
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-8 text-left">
            <div className="flex items-start space-x-4">
                <ShieldCheck className="text-emerald-500 mt-1 shrink-0" size={20} />
                <div>
                   <h3 className="text-white font-bold text-sm uppercase tracking-wider">Status Update</h3>
                   <p className="text-slate-400 text-sm mt-1">
                     Our engineers are working on the database optimization. No data will be lost during this process.
                   </p>
                </div>
            </div>
        </div>

        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Developed by J.V group
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
