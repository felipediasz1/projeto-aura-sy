import React from 'react';
import { motion } from 'framer-motion';
import { CircleDollarSign, Activity } from 'lucide-react';
import { Company } from '@aura-sync/shared';

interface CompanyCardProps {
  company: Company;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-aura-green';
      case 'syncing': return 'bg-aura-blue animate-aura-pulse';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.18 }} className="bg-aura-gray rounded-2xl p-6 shadow-xl border border-aura-black/40 hover:border-aura-blue/40 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-aura-black/30 p-1 rounded-md"><CircleDollarSign className="w-4 h-4 text-aura-blue" /></div>
          <div>
            <h3 className="text-xl font-bold text-white">{company.name}</h3>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-300">Empresa</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs ${company.status === 'online' ? 'text-aura-green' : company.status === 'syncing' ? 'text-aura-blue' : 'text-red-400'}`}>
          <Activity className={`w-4 h-4 ${company.status === 'syncing' ? 'animate-spin text-aura-blue' : ''}`} />
          <span>{company.status}</span>
        </div>
      </div>
      <p className="text-gray-300 mb-4 text-sm">Última sincronização: {company.lastSync.toLocaleString()}</p>
      <div className="space-y-2">
        {company.machines.map(machine => (
          <div key={machine.id} className="flex items-center justify-between bg-black/20 rounded-xl p-3">
            <span className="text-sm text-white">{machine.name}</span>
            <div className={`flex items-center gap-2`}>
              <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(machine.status)}`} />
              <span className="text-xs text-gray-300">{machine.status}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default CompanyCard;