import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Barcode, Filter, Sparkles } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { Product, OrderWithItems } from '../types/pos';

export const BillingView: React.FC = () => {
  const { products, categories, isLoading } = usePOS();
  const { addItem } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderWithItems | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Barcode scanner listener: when barcode is entered and Enter key is pressed
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
    <div className="flex-1 flex overflow-hidden bg-slate-950">
      {/* Catalog & Search Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Controls: Search Bar & Barcode input */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center space-x-3">
          {/* General Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name, SKU or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Barcode Quick Scanner Form */}
          <form onSubmit={handleBarcodeSubmit} className="relative w-64">
            <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan barcode [Enter]..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full bg-slate-800/90 border border-blue-500/30 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </form>
        </div>

        {/* Category Pills Bar */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white'
            }`}
          >
            All Products ({products.length})
          </button>

          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Loading local catalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
              <Filter className="w-10 h-10 opacity-30 mb-2" />
              <p className="text-sm font-semibold text-slate-400">No matching products found</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
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

      {/* Right-Hand Cart Drawer */}
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
