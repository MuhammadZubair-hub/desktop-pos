import React, { useState, useEffect } from 'react';
import { ShoppingBag, Package, BarChart3, Wifi, Radio, Smartphone, Key, ShieldCheck, Database } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { StatusPill } from './StatusPill';

interface NavbarProps {
  activeTab: 'billing' | 'inventory' | 'sales';
  setActiveTab: (tab: 'billing' | 'inventory' | 'sales') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { serverStatus, isWsConnected, settings } = usePOS();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const primaryIp = serverStatus?.primaryIp || '127.0.0.1';
  const mobileCount = serverStatus?.activeWsClients || 0;
  const pin = settings.pairing_pin || serverStatus?.pairingPin || '1234';
  const storeName = settings.store_name || 'POS Terminal';

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none">
      {/* Left: Brand & Navigation */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white tracking-wide text-base">{storeName}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                OFFLINE HOST
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Zero-Cloud Local POS Terminal</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'billing'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-750'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Billing</span>
            <span className="text-[10px] opacity-60 font-mono">F1</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-750'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventory</span>
            <span className="text-[10px] opacity-60 font-mono">F2</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sales'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-750'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Sales & Wi-Fi Network</span>
            <span className="text-[10px] opacity-60 font-mono">F3</span>
          </button>
        </nav>
      </div>

      {/* Right: Real-time Host Network Status Badges */}
      <div className="flex items-center space-x-3">
        {/* Local Wi-Fi Host IP */}
        <StatusPill
          status={isWsConnected ? 'online' : 'warning'}
          label={`${primaryIp}:5000`}
          sublabel="LAN IP"
          icon={<Wifi className="w-3 h-3" />}
        />

        {/* UDP Beacon Status */}
        <StatusPill
          status="online"
          label="UDP Beacon"
          sublabel=":5001"
          icon={<Radio className="w-3 h-3 text-cyan-400" />}
        />

        {/* Connected Mobile Companions */}
        <StatusPill
          status={mobileCount > 0 ? 'online' : 'info'}
          label={`${mobileCount} Mobile`}
          sublabel="Sync"
          icon={<Smartphone className="w-3 h-3" />}
        />

        {/* Pairing PIN */}
        <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-full text-xs font-mono text-amber-300">
          <Key className="w-3 h-3 opacity-80" />
          <span>PIN: {pin}</span>
        </div>

        {/* Clock */}
        <div className="text-right pl-2 border-l border-slate-800">
          <div className="text-xs font-mono font-medium text-slate-300">{time}</div>
          <div className="text-[10px] text-slate-500 font-sans">Local Time</div>
        </div>
      </div>
    </header>
  );
};
