import React, { useState, useEffect } from 'react';
import { Pizza, ShoppingBag, Package, BarChart3, Wifi, Radio, Smartphone, Key, ShieldCheck } from 'lucide-react';
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
  const storeName = settings.store_name || "OCTOPIZZA'S Fast Food";

  return (
    <header className="h-16 bg-neutral-950 border-b-2 border-yellow-400/40 px-4 flex items-center justify-between select-none">
      {/* Left: Brand & Navigation */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-500/20 text-black">
            <Pizza className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-white tracking-wider text-base uppercase">
                {storeName}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-400 text-black tracking-wide">
                LOCAL POS
              </span>
            </div>
            <p className="text-[11px] text-yellow-400/90 font-medium tracking-wide">Pure, Fresh & Delicious</p>
          </div>
        </div>

        {/* Navigation Tabs (White/Black/Yellow) */}
        <nav className="flex items-center space-x-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
              activeTab === 'billing'
                ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/30'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>POS Billing</span>
            <span className="text-[10px] opacity-75 font-mono">F1</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
              activeTab === 'inventory'
                ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/30'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Menu Catalog</span>
            <span className="text-[10px] opacity-75 font-mono">F2</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
              activeTab === 'sales'
                ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/30'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Sales & Wi-Fi Host</span>
            <span className="text-[10px] opacity-75 font-mono">F3</span>
          </button>
        </nav>
      </div>

      {/* Right: Network Status Badges */}
      <div className="flex items-center space-x-3">
        {/* Local Wi-Fi Host IP */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900 text-xs font-mono text-neutral-200">
          <Wifi className="w-3.5 h-3.5 text-yellow-400" />
          <span>{primaryIp}:5000</span>
        </div>

        {/* UDP Beacon Status */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-xs text-yellow-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <Radio className="w-3 h-3 text-yellow-400" />
          <span>UDP: 5001</span>
        </div>

        {/* Connected Mobile Companions */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full border border-neutral-800 bg-neutral-900 text-xs text-neutral-300">
          <Smartphone className="w-3.5 h-3.5 text-yellow-400" />
          <span>{mobileCount} Mobile Sync</span>
        </div>

        {/* Pairing PIN */}
        <div className="flex items-center space-x-1.5 bg-yellow-400 text-black px-2.5 py-1 rounded-full text-xs font-mono font-black">
          <Key className="w-3 h-3" />
          <span>PIN: {pin}</span>
        </div>

        {/* Clock */}
        <div className="text-right pl-2 border-l border-neutral-800">
          <div className="text-xs font-mono font-bold text-white">{time}</div>
          <div className="text-[10px] text-neutral-400 font-sans">Pakistan Standard</div>
        </div>
      </div>
    </header>
  );
};
