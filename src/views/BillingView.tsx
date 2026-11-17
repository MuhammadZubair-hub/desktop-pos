import React, { useState, useMemo, useRef } from 'react';
import { Search, Barcode, Filter } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { OrderWithItems } from '../types/pos';

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
    <div className="flex-1 flex overflow-hidden bg-[#0A0A0A]">
      {/* Catalog & Search Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Controls: Search Bar & Barcode input */}
        <div className="p-3.5 bg-[#121212] border-b border-neutral-800 flex items-center space-x-3">
          {/* General Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search pizza, burger, shawarma, deal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Barcode Quick Scanner Form */}
          <form onSubmit={handleBarcodeSubmit} className="relative w-64">
            <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-yellow-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan barcode [Enter]..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-yellow-300 placeholder-neutral-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            />
          </form>
        </div>

        {/* Category Pills Bar */}
        <div className="px-4 py-2.5 bg-[#0E0E0E] border-b border-neutral-800 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/20'
                : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800'
            }`}
          >
            All Items ({products.length})
          </button>

          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/20'
                    : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800'
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
            <div className="h-full flex items-center justify-center text-neutral-400 text-xs">
              Loading Octopizza's catalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400">
              <Filter className="w-10 h-10 opacity-30 mb-2 text-yellow-400" />
              <p className="text-sm font-bold text-white">No matching food items found</p>
              <p className="text-xs text-neutral-400 mt-1">Try searching for pizza, zinger, pasta, or roll</p>
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
