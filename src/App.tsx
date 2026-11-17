import React, { useState, useEffect } from 'react';
import { POSProvider } from './context/POSContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { BillingView } from './views/BillingView';
import { InventoryView } from './views/InventoryView';
import { SalesNetworkView } from './views/SalesNetworkView';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'billing' | 'inventory' | 'sales'>('billing');

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('billing');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('inventory');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('sales');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'billing' && <BillingView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'sales' && <SalesNetworkView />}
      </main>
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
