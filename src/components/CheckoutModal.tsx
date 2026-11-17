import React, { useState, useMemo } from 'react';
import { X, CreditCard, Banknote, CheckCircle, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { usePOS } from '../context/POSContext';
import { PaymentMethod, OrderWithItems } from '../types/pos';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: OrderWithItems) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { items, subtotal, discountAmount, taxAmount, total, clearCart } = useCart();
  const { settings, submitOrder } = usePOS();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [tenderedInput, setTenderedInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currency = settings.currency_symbol || '$';

  const tenderedAmount = useMemo(() => {
    if (paymentMethod !== 'CASH') return total;
    if (!tenderedInput) return total;
    return parseFloat(tenderedInput) || 0;
  }, [paymentMethod, tenderedInput, total]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'CASH') return 0;
    return Number(Math.max(0, tenderedAmount - total).toFixed(2));
  }, [paymentMethod, tenderedAmount, total]);

  const isTenderSufficient = paymentMethod !== 'CASH' || tenderedAmount >= total;

  if (!isOpen) return null;

  const handleQuickCash = (amount: number) => {
    setTenderedInput(amount.toString());
  };

  const handleCompleteOrder = async () => {
    if (!isTenderSufficient) {
      setErrorMessage(`Tendered amount is less than total due (${currency}${total.toFixed(2)})`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const orderPayload = {
        items: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          qty: item.qty,
          unitPrice: item.unitPrice,
        })),
        paymentMethod,
        discount: discountAmount,
        tax: taxAmount,
        source: 'DESKTOP' as const,
      };

      const createdOrder = await submitOrder(orderPayload);
      clearCart();
      onSuccess(createdOrder);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete order. Please check stock and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Complete Sale</h3>
            <p className="text-xs text-slate-400">Select payment method and finalize invoice</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Total Banner */}
          <div className="bg-slate-850 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Amount Due</span>
              <div className="text-3xl font-bold font-mono text-emerald-400 mt-1">
                {currency}{total.toFixed(2)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-400 space-y-0.5">
              <div>Subtotal: <span className="font-mono text-slate-200">{currency}{subtotal.toFixed(2)}</span></div>
              {discountAmount > 0 && (
                <div className="text-amber-400">Discount: <span className="font-mono">-{currency}{discountAmount.toFixed(2)}</span></div>
              )}
              <div>Tax: <span className="font-mono text-slate-200">+{currency}{taxAmount.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-center justify-center space-x-3 p-4 rounded-xl border font-bold text-sm transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>Cash Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex items-center justify-center space-x-3 p-4 rounded-xl border font-bold text-sm transition-all ${
                  paymentMethod === 'CARD'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Credit / Debit Card</span>
              </button>
            </div>
          </div>

          {/* Cash Details */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-4 bg-slate-850/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tendered Amount ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={total.toFixed(2)}
                  value={tenderedInput}
                  onChange={(e) => setTenderedInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Cash Presets */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Quick Cash Bills:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(total)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-xs font-mono font-medium border border-slate-700"
                  >
                    Exact ({currency}{total.toFixed(2)})
                  </button>
                  {[100, 500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickCash(amt)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-xs font-mono font-medium border border-slate-700"
                    >
                      {currency}{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change calculation */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Change Due:</span>
                <span className={`text-xl font-mono font-bold ${changeDue > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {currency}{changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-850 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCompleteOrder}
            disabled={isSubmitting || !isTenderSufficient}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
              isSubmitting || !isTenderSufficient
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Processing Transaction...' : 'Complete & Generate Receipt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
