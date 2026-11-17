import React from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Tag } from 'lucide-react';
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
  const currency = settings.currency_symbol || 'Rs. ';
  const taxRate = settings.tax_rate || '0';

  return (
    <div className="w-96 bg-[#0E0E0E] border-l border-neutral-800 flex flex-col h-[calc(100vh-4rem)] select-none">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-[#141414]">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-sm tracking-wide">Current Order</h2>
            {itemCount > 0 ? (
              <span className="text-[11px] text-yellow-400 font-mono font-bold">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            ) : (
              <span className="text-[11px] text-neutral-400">Empty</span>
            )}
          </div>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-neutral-400 hover:text-rose-400 flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3">
              <ShoppingCart className="w-8 h-8 opacity-40 text-yellow-400" />
            </div>
            <p className="font-bold text-white text-sm">Cart is empty</p>
            <p className="text-xs text-neutral-400 mt-1 max-w-[220px]">
              Select items from the Octopizza menu to add them to this order.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="bg-[#141414] border border-neutral-800 rounded-xl p-3 flex flex-col space-y-2 hover:border-yellow-400/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-2">
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {item.product.name}
                  </h4>
                  <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                    {currency}{item.unitPrice.toFixed(0)} each
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold font-mono text-yellow-400 text-sm">
                    {currency}{(item.unitPrice * item.qty).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Quantity Controls & Remove */}
              <div className="flex items-center justify-between pt-1.5 border-t border-neutral-800/80">
                <div className="flex items-center space-x-1 bg-neutral-900 rounded-lg p-0.5 border border-neutral-800">
                  <button
                    onClick={() => updateQty(item.product.id, item.qty - 1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-xs text-white">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.product.id, item.qty + 1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-1.5 text-neutral-400 hover:text-rose-400 transition-colors"
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
        <div className="p-4 bg-[#141414] border-t border-neutral-800 space-y-3">
          {/* Discount input */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="number"
                min="0"
                step="10"
                placeholder="Discount (Rs.)"
                value={discount > 0 ? discount : ''}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-yellow-400"
              />
            </div>
            {discount > 0 && (
              <button
                onClick={() => setDiscount(0)}
                className="text-[11px] text-neutral-400 hover:text-white px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>

          {/* Breakdown */}
          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal</span>
              <span className="font-mono font-semibold text-white">{currency}{subtotal.toFixed(0)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-yellow-400">
                <span>Discount</span>
                <span className="font-mono font-semibold">-{currency}{discountAmount.toFixed(0)}</span>
              </div>
            )}

            {Number(taxRate) > 0 && (
              <div className="flex justify-between text-neutral-400">
                <span>Tax ({taxRate}%)</span>
                <span className="font-mono font-semibold text-white">+{currency}{taxAmount.toFixed(0)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2.5 border-t border-neutral-800 text-white font-extrabold">
              <span className="text-sm uppercase tracking-wide">Total Amount</span>
              <span className="text-2xl font-mono text-yellow-400">{currency}{total.toFixed(0)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onOpenCheckout}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-yellow-400/20 flex items-center justify-between transition-all active:scale-[0.99]"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm uppercase tracking-wider">Pay & Checkout</span>
            </div>
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-base font-black">{currency}{total.toFixed(0)}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
