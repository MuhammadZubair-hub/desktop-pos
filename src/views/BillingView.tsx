import React, { useState, useMemo, useRef } from 'react';
import { Search, Barcode, Filter } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { OrderWithItems } from '../types/pos';

interface BillingViewProps {
  searchQuery?: string;
}

export const BillingView: React.FC<BillingViewProps> = ({ searchQuery = '' }) => {
  const { products, categories, isLoading } = usePOS();
  const { addItem } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderWithItems | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const activeSearch = searchQuery || localSearch;

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
      const q = activeSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, activeSearch]);

  // Barcode scanner listener
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const matched = products.find(
      (p) => p.barcode === code || p.sku?.toLowerCase() === code.toLowerCase()
    );

    if (matched) {
      if (matched.stock_qty > 0) {
        addItem(matched, 1);
        setBarcodeInput('');
      } else {
        alert(`Product "${matched.name}" is out of stock!`);
      }
    } else {
      alert(`No product found with barcode/SKU: ${code}`);
    }
  };

  const handleCheckoutSuccess = (order: OrderWithItems) => {
    setIsCheckoutOpen(false);
    setCompletedOrder(order);
    setIsReceiptOpen(true);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F8FAFC]">
      {/* Catalog & Search Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Controls: Category Pills Bar & Barcode scan */}
        <div className="px-6 py-3 bg-white border-b border-slate-200/80 flex items-center justify-between space-x-4 shrink-0 shadow-xs">
          {/* Category Pills Bar (Zillo Behance Style: All Menu, Combos, Burgers, Pizzas...) */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-yellow-400 text-slate-950 shadow-sm shadow-yellow-400/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/80'
              }`}
            >
              All Menu ({products.length})
            </button>

            {categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-yellow-400 text-slate-950 shadow-sm shadow-yellow-400/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Quick Barcode Scanner input */}
          <form onSubmit={handleBarcodeSubmit} className="relative w-56 shrink-0 hidden md:block">
            <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan Barcode [Enter]..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-full pl-9 pr-3 py-1.5 text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:border-yellow-400 focus:bg-white"
            />
          </form>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Loading Octopizza's catalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <Filter className="w-12 h-12 opacity-30 mb-2 text-yellow-500" />
              <p className="text-base font-extrabold text-slate-800">No matching food items found</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for pizza, zinger burger, pasta, or roll</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={(p) => addItem(p, 1)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right-Hand Cart Ticket Panel (Behance Screenshot style) */}
      <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        order={completedOrder}
        onClose={() => {
          setIsReceiptOpen(false);
          setCompletedOrder(null);
        }}
      />
    </div>
  );
};
