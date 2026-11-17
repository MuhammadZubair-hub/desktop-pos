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

  const currency = settings.currency_symbol || 'Rs. ';

  const tenderedAmount = useMemo(() => {
    if (paymentMethod !== 'CASH') return total;
    if (!tenderedInput) return total;
    return parseFloat(tenderedInput) || 0;
  }, [paymentMethod, tenderedInput, total]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'CASH') return 0;
    return Number(Math.max(0, tenderedAmount - total).toFixed(0));
  }, [paymentMethod, tenderedAmount, total]);

  const isTenderSufficient = paymentMethod !== 'CASH' || tenderedAmount >= total;

  if (!isOpen) return null;

  const handleQuickCash = (amount: number) => {
    setTenderedInput(amount.toString());
  };

  const handleCompleteOrder = async () => {
    if (!isTenderSufficient) {
      setErrorMessage(`Tendered amount is less than total due (${currency}${total.toFixed(0)})`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2.5">
              <img
                src="/images/logo.png"
                alt="OCTOPIZZA'S"
                className="w-6 h-6 object-cover rounded-full border border-slate-200"
              />
              <span>Finalize Payment</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Select payment mode and collect bill amount</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Total Payable Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Total Amount Due</span>
              <div className="text-3xl font-black font-mono text-slate-950 mt-1">
                {currency}{total.toFixed(0)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 space-y-0.5">
              <div>Subtotal: <span className="font-mono font-bold text-slate-800">{currency}{subtotal.toFixed(0)}</span></div>
              {discountAmount > 0 && (
                <div className="text-amber-600 font-bold">Discount: <span className="font-mono">-{currency}{discountAmount.toFixed(0)}</span></div>
              )}
              {taxAmount > 0 && (
                <div>GST / Tax: <span className="font-mono font-bold text-slate-800">+{currency}{taxAmount.toFixed(0)}</span></div>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-center justify-center space-x-3 p-4 rounded-2xl border font-black text-sm transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-yellow-400 text-slate-950 border-yellow-400 shadow-md shadow-yellow-400/25'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 stroke-[2.2]" />
                <span>Cash Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex items-center justify-center space-x-3 p-4 rounded-2xl border font-black text-sm transition-all ${
                  paymentMethod === 'CARD'
                    ? 'bg-yellow-400 text-slate-950 border-yellow-400 shadow-md shadow-yellow-400/25'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 stroke-[2.2]" />
                <span>Card / POS Machine</span>
              </button>
            </div>
          </div>

          {/* Cash Details */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tendered Cash ({currency})
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder={total.toFixed(0)}
                  value={tenderedInput}
                  onChange={(e) => setTenderedInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xl font-mono font-black text-slate-950 focus:outline-none focus:border-yellow-400 shadow-xs"
                />
              </div>

              {/* Quick Cash Presets (Pakistani Currency Notes) */}
              <div>
                <span className="text-[11px] text-slate-500 block mb-1.5 font-bold">Quick Currency Notes:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(total)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-mono font-black border border-slate-300 shadow-2xs"
                  >
                    Exact ({currency}{total.toFixed(0)})
                  </button>
                  {[100, 500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickCash(amt)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-mono font-bold border border-slate-300 shadow-2xs"
                    >
                      {currency}{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change calculation */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Change Due:</span>
                <span className={`text-2xl font-mono font-black ${changeDue > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {currency}{changeDue.toFixed(0)}
                </span>
              </div>
            </div>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCompleteOrder}
            disabled={isSubmitting || !isTenderSufficient}
            className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center space-x-2 transition-all ${
              isSubmitting || !isTenderSufficient
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-md shadow-yellow-400/25'
            }`}
          >
            <CheckCircle className="w-4 h-4 stroke-[2.5]" />
            <span>{isSubmitting ? 'Processing Bill...' : 'Complete & Print Bill'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
