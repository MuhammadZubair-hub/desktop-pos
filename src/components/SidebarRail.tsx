import React from 'react';
import {
  LayoutGrid,
  BarChart3,
  Package,
  Wifi,
  Pizza,
  Bell,
  Settings,
  User,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

interface SidebarRailProps {
  activeTab: 'billing' | 'reports' | 'inventory' | 'sales';
  setActiveTab: (tab: 'billing' | 'reports' | 'inventory' | 'sales') => void;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({ activeTab, setActiveTab }) => {
  const { isWsConnected } = usePOS();

  return (
    <aside className="w-18 w-[72px] bg-white border-r border-slate-200/80 flex flex-col items-center justify-between py-4 select-none z-20 shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
      {/* Top: Brand Logo */}
      <div className="flex flex-col items-center space-y-6">
        <button
          onClick={() => setActiveTab('billing')}
          className="w-11 h-11 rounded-2xl bg-slate-950 flex items-center justify-center text-yellow-400 shadow-md shadow-slate-950/20 hover:scale-105 transition-all group"
          title="OCTOPIZZA'S POS"
        >
          <Pizza className="w-6 h-6 stroke-[2.2] group-hover:rotate-12 transition-transform" />
        </button>

        {/* Navigation Action Buttons */}
        <nav className="flex flex-col items-center space-y-2.5">
          {/* POS Billing (Grid icon as in Behance) */}
          <button
            onClick={() => setActiveTab('billing')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'billing'
                ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-400/30 font-black'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="POS Terminal / Billing (F1)"
          >
            <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Reports & Analytics (Bar chart icon as requested by user) */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative ${
              activeTab === 'reports'
                ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-400/30 font-black'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Sales Reports & Analytics"
          >
            <BarChart3 className="w-5 h-5 stroke-[2.2]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 border-2 border-white" />
          </button>

          {/* Menu Catalog & Inventory */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'inventory'
                ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-400/30 font-black'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Menu Catalog & Stock (F2)"
          >
            <Package className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Wi-Fi Host & LAN Network */}
          <button
            onClick={() => setActiveTab('sales')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative ${
              activeTab === 'sales'
                ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-400/30 font-black'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Wi-Fi Mobile Host & Network (F3)"
          >
            <Wifi className="w-5 h-5 stroke-[2.2]" />
            <span
              className={`absolute bottom-2 right-2 w-2 h-2 rounded-full ${
                isWsConnected ? 'bg-emerald-500' : 'bg-yellow-400'
              }`}
            />
          </button>
        </nav>
      </div>

      {/* Bottom: Staff Profile & System indicator */}
      <div className="flex flex-col items-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs" title="Cashier Terminal">
          <User className="w-4 h-4 text-slate-600" />
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Ready" />
      </div>
    </aside>
  );
};
