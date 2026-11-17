import React from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Percent, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { usePOS } from '../context/POSContext';

interface CartDrawerProps {
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout }) => {
  const {
    items,
    updateQty,
    removeItem,
    clearCart,
    subtotal,
    discount,
    setDiscount,
    discountAmount,
    taxAmount,
    total,
    itemCount,
  } = useCart();
  const { settings } = usePOS();
  const currency = settings.currency_symbol || '$';
  const taxRate = settings.tax_rate || '8.5';

  return (
    <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-[calc(100vh-4rem)] select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-5 h-5 text-blue-400" />
          <h2 className="font-bold text-white text-base">Current Cart</h2>
          {itemCount > 0 && (
            <span className="bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs px-2 py-0.5 rounded-full font-mono font-medium">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 px-2 py-1 rounded hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-16 h-16 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mb-3">
              <ShoppingCart className="w-8 h-8 opacity-40 text-slate-400" />
            </div>
            <p className="font-medium text-slate-300 text-sm">Cart is currently empty</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
              Scan a barcode or click products from the catalog to add items.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="bg-slate-850/80 border border-slate-800 rounded-xl p-3 flex flex-col space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-2">
                  <h4 className="text-sm font-semibold text-slate-100 leading-tight">
                    {item.product.name}
                  </h4>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {currency}{item.unitPrice.toFixed(2)} each
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold font-mono text-emerald-400 text-sm">
                    {currency}{(item.unitPrice * item.qty).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Quantity Controls & Remove */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700/60">
                  <button
                    onClick={() => updateQty(item.product.id, item.qty - 1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-xs text-white">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.product.id, item.qty + 1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Calculations & Checkout */}
      {items.length > 0 && (
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          {/* Discount input */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Discount amount"
                value={discount > 0 ? discount : ''}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            {discount > 0 && (
              <button
                onClick={() => setDiscount(0)}
                className="text-[11px] text-slate-400 hover:text-white px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>

          {/* Breakdown */}
          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono text-slate-200">{currency}{subtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Discount</span>
                <span className="font-mono">-{currency}{discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-400">
              <span>Tax ({taxRate}%)</span>
              <span className="font-mono text-slate-200">+{currency}{taxAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-800 text-white font-bold">
              <span className="text-sm">Total Due</span>
              <span className="text-xl font-mono text-emerald-400">{currency}{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onOpenCheckout}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-between transition-all active:scale-[0.99]"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm">Proceed to Checkout</span>
            </div>
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-base">{currency}{total.toFixed(2)}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
