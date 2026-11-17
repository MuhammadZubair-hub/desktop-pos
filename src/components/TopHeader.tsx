import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Wifi,
  Radio,
  Smartphone,
  Key,
  Clock,
  User,
  X,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

interface TopHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'billing' | 'reports' | 'inventory' | 'sales';
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  activeTab,
}) => {
  const { serverStatus, settings } = usePOS();
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const primaryIp = serverStatus?.primaryIp || '127.0.0.1';
  const pairingPin = settings.pairing_pin || serverStatus?.pairingPin || '1234';
  const mobileCount = serverStatus?.activeWsClients || 0;

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between select-none z-10 shrink-0">
      {/* Left: Search Bar & Multi-Order Tabs */}
      <div className="flex items-center space-x-5 flex-1 max-w-2xl">
        {/* Modern Search Input (as in Behance screenshot) */}
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white border border-transparent focus:border-yellow-400 rounded-full pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 transition-all outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Order Tabs (as in Behance screenshot) */}
        {activeTab === 'billing' && (
          <div className="hidden lg:flex items-center space-x-2">
            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
              <span>Order #Current</span>
            </div>

            <button
              onClick={() => setSearchQuery('')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-black shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Order</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Network info, PIN, Cashier Profile */}
      <div className="flex items-center space-x-3.5">
        {/* Local Wi-Fi Badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 font-medium">
          <Wifi className="w-3.5 h-3.5 text-yellow-500" />
          <span>{primaryIp}:5000</span>
        </div>

        {/* Mobile PIN Badge */}
        <div className="hidden sm:flex items-center space-x-1 bg-yellow-400 text-slate-950 px-2.5 py-1 rounded-full text-xs font-mono font-black">
          <Key className="w-3 h-3" />
          <span>PIN: {pairingPin}</span>
        </div>

        {/* Live Clock */}
        <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-700 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time}</span>
        </div>

        {/* Cashier / Restaurant Profile with Official Brand Logo */}
        <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-slate-950 p-0.5 border border-slate-200 shadow-xs overflow-hidden flex items-center justify-center">
            <img
              src="/images/logo.png"
              alt="OCTOPIZZA'S"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="text-left hidden xl:block">
            <div className="text-xs font-black text-slate-900 leading-tight">OCTOPIZZA'S</div>
            <div className="text-[10px] text-slate-500 font-medium">Fast, Fresh & Delicious</div>
          </div>
        </div>
      </div>
    </header>
  );
};
