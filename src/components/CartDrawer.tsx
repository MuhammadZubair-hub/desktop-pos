import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  Printer,
  CreditCard,
  Tag,
  Receipt,
  UtensilsCrossed,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { usePOS } from '../context/POSContext';
import { getProductImage } from '../utils/productImages';

interface CartDrawerProps {
  onOpenCheckout: () => void;
  onQuickPrintReceipt?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout, onQuickPrintReceipt }) => {
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

  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('TAKEAWAY');
  const [tableNo, setTableNo] = useState<string>('Counter 1');

  return (
    <aside className="w-96 bg-white border-l border-slate-200/90 flex flex-col h-[calc(100vh-4rem)] select-none shrink-0 shadow-[-2px_0_12px_rgba(0,0,0,0.03)] z-10">
      {/* Ticket Header (as in Behance screenshot: Order No. #5266 | Table No. 12) */}
      <div className="p-4 border-b border-slate-200/80 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">Active Ticket</div>
            <div className="text-base font-black text-slate-900 font-mono">
              Order #{Math.floor(subtotal % 9000 + 1000)}
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setOrderType('TAKEAWAY')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                orderType === 'TAKEAWAY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Takeaway
            </button>
            <button
              onClick={() => setOrderType('DINE_IN')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                orderType === 'DINE_IN'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dine-In
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
            <span className="font-bold text-slate-500">
              {itemCount} {itemCount === 1 ? 'Item' : 'Items'} Selected
            </span>
            <button
              onClick={clearCart}
              className="text-rose-500 hover:text-rose-700 font-bold flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Order</span>
            </button>
          </div>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50/50">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-3 text-slate-400">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <p className="font-extrabold text-slate-800 text-sm">No items in current order</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[210px]">
              Click on any food item from the menu catalog to build customer's ticket.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs flex flex-col space-y-2 hover:border-yellow-400/80 transition-all"
            >
              <div className="flex items-start justify-between space-x-2.5">
                <img
                  src={getProductImage(item.product.name, item.product.category_name)}
                  alt={item.product.name}
                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                />
                <div className="flex-1 pr-1">
                  <h4 className="text-xs font-black text-slate-900 leading-tight line-clamp-1">
                    {item.qty}x {item.product.name}
                  </h4>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    {currency}{item.unitPrice.toFixed(0)} each
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black font-mono text-slate-900 text-sm">
                    {currency}{(item.unitPrice * item.qty).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Quantity Controls & Remove */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-1 bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                  <button
                    onClick={() => updateQty(item.product.id, item.qty - 1)}
                    className="w-5 h-5 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                  >
                    <Minus className="w-3 h-3 stroke-[3]" />
                  </button>
                  <span className="w-6 text-center font-mono font-black text-xs text-slate-900">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.product.id, item.qty + 1)}
                    className="w-5 h-5 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Calculations & Dual Action Buttons (Zillo Behance Style) */}
      {items.length > 0 && (
        <div className="p-4 bg-white border-t border-slate-200/80 space-y-3 shrink-0">
          {/* Quick Discount Input */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min="0"
                step="10"
                placeholder="Discount (Rs.)"
                value={discount > 0 ? discount : ''}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-yellow-400 focus:bg-white transition-all font-mono"
              />
            </div>
            {discount > 0 && (
              <button
                onClick={() => setDiscount(0)}
                className="text-[11px] text-slate-400 hover:text-slate-700 px-2 py-1 font-semibold"
              >
                Reset
              </button>
            )}
          </div>

          {/* Breakdown Numbers */}
          <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Subtotal</span>
              <span className="font-mono text-slate-900 font-bold">{currency}{subtotal.toFixed(0)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-amber-600 font-semibold">
                <span>Discount</span>
                <span className="font-mono">-{currency}{discountAmount.toFixed(0)}</span>
              </div>
            )}

            {Number(taxRate) > 0 && (
              <div className="flex justify-between text-slate-500 font-medium">
                <span>GST / Tax ({taxRate}%)</span>
                <span className="font-mono text-slate-900 font-bold">+{currency}{taxAmount.toFixed(0)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
              <span className="text-sm font-black uppercase tracking-wide">Total Amount</span>
              <span className="text-2xl font-mono font-black text-slate-950">
                {currency}{total.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Dual Action Buttons (Print Bill & Take Payment - Behance Screenshot style) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={onQuickPrintReceipt || onOpenCheckout}
              className="w-full py-3 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs"
            >
              <Printer className="w-4 h-4 stroke-[2.2]" />
              <span>Print Bill</span>
            </button>

            <button
              onClick={onOpenCheckout}
              className="w-full py-3 px-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-yellow-400/25 transition-all active:scale-98"
            >
              <CreditCard className="w-4 h-4 stroke-[2.5]" />
              <span>Take Payment</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
