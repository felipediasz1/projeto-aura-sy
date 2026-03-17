import React from 'react';
import { motion } from 'framer-motion';
import { Company } from '@aura-sync/shared';
import { Home, Server, Settings, UserCircle2 } from 'lucide-react';

interface DashboardLayoutProps {
  companies: Company[];
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ companies, children }) => {
  return (
    <div className="min-h-screen bg-aura-black text-white">
      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr]">
<aside className="bg-aura-gray text-white border-r border-aura-black/40 p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0071e3] to-[#32d74b] flex items-center justify-center shadow-lg shadow-aura-blue/30 animate-aura-pulse overflow-hidden">
              <img src="/aura-sync-icon.svg" alt="Aura Sync icon" className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-aura-blue">Aura Sync</p>
              <p className="text-lg font-bold leading-5">Control Center</p>
              <p className="text-xs text-gray-300">Protegendo seus arquivos com backup inteligente</p>
            </div>
          </div>
          <nav className="space-y-2">
            <button className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-aura-black/20 transition"><Home className="w-4 h-4 text-aura-blue" /> Visão Geral</button>
            <button className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-aura-black/20 transition"><Server className="w-4 h-4 text-aura-blue" /> Empresas</button>
            <button className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-aura-black/20 transition"><Settings className="w-4 h-4 text-aura-blue" /> Configurações</button>
          </nav>
          <div className="mt-8 text-xs text-gray-300">
            Escaneamento incremental ativado por padrão.
          </div>
        </aside>

        <main className="p-5 xl:p-8">
          <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center justify-between bg-slate-900/60 border border-aura-gray rounded-2xl p-4 mb-6 shadow-lg shadow-aura-blue/10 backdrop-blur-md">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-aura-blue">Conectado</p>
              <h1 className="text-3xl font-black">Painel Multi-Tenant</h1>
              <p className="text-sm text-gray-300 mt-1">Visão 360° dos backups em tempo real.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-slate-900/80 border border-aura-gray/40 rounded-xl px-3 py-2">
                <img src="/aura-sync-logo-dark.svg" alt="Aura Sync" className="h-7" />
              </div>
              <div className="text-right mr-3">
                <p className="text-xs text-gray-300">Administrador</p>
                <p className="text-sm font-semibold">Felipe</p>
              </div>
              <div className="relative rounded-full border border-aura-blue/30 shadow-[0_0_20px_rgba(0,113,227,0.4)] p-0.5">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-aura-blue to-aura-green flex items-center justify-center">
                  <UserCircle2 className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </motion.header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-6">
            <div className="rounded-2xl bg-aura-gray p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-gray-300">Empresas</div>
              <div className="mt-2 text-2xl font-bold">{companies.length}</div>
            </div>
            <div className="rounded-2xl bg-aura-gray p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-gray-300">Máquinas</div>
              <div className="mt-2 text-2xl font-bold">{companies.reduce((acc, c) => acc + c.machines.length, 0)}</div>
            </div>
            <div className="rounded-2xl bg-aura-gray p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-gray-300">Status</div>
              <div className="mt-2 text-2xl font-bold text-aura-green">Seguro</div>
            </div>
          </section>

          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
