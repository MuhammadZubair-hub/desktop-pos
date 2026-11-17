import React, { useState, useEffect } from 'react';
import { POSProvider } from './context/POSContext';
import { CartProvider } from './context/CartContext';
import { SidebarRail } from './components/SidebarRail';
import { TopHeader } from './components/TopHeader';
import { BillingView } from './views/BillingView';
import { ReportsView } from './views/ReportsView';
import { InventoryView } from './views/InventoryView';
import { SalesNetworkView } from './views/SalesNetworkView';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'billing' | 'reports' | 'inventory' | 'sales'>('billing');
  const [searchQuery, setSearchQuery] = useState('');

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('billing');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('reports');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('inventory');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('sales');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* 1. Left Slim Navigation Rail (Zillo Behance Style) */}
      <SidebarRail activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header with Global Search and Multi-Order Tabs */}
        <TopHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
        />

        {/* View Switcher */}
        <main className="flex-1 flex overflow-hidden">
          {activeTab === 'billing' && <BillingView searchQuery={searchQuery} />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'sales' && <SalesNetworkView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </POSProvider>
  );
}
