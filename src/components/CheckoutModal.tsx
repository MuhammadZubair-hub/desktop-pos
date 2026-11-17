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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#121212] border border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-[#171717]">
          <div>
            <h3 className="text-lg font-black text-white flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span>Finalize Customer Payment</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">Select payment mode and confirm bill amount</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Total Banner */}
          <div className="bg-[#181818] border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Total Payable</span>
              <div className="text-3xl font-black font-mono text-yellow-400 mt-1">
                {currency}{total.toFixed(0)}
              </div>
            </div>
            <div className="text-right text-xs text-neutral-400 space-y-0.5">
              <div>Subtotal: <span className="font-mono text-white">{currency}{subtotal.toFixed(0)}</span></div>
              {discountAmount > 0 && (
                <div className="text-yellow-400">Discount: <span className="font-mono">-{currency}{discountAmount.toFixed(0)}</span></div>
              )}
              {taxAmount > 0 && (
                <div>Tax: <span className="font-mono text-white">+{currency}{taxAmount.toFixed(0)}</span></div>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-400 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-center justify-center space-x-3 p-4 rounded-xl border font-bold text-sm transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/20'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
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
                    ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/20'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Card / POS Machine</span>
              </button>
            </div>
          </div>

          {/* Cash Details */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Tendered Amount ({currency})
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder={total.toFixed(0)}
                  value={tenderedInput}
                  onChange={(e) => setTenderedInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xl font-mono font-bold text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              {/* Quick Cash Presets (Pakistani Currency Notes) */}
              <div>
                <span className="text-[11px] text-neutral-400 block mb-1.5 font-medium">Quick Cash Notes:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(total)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-mono font-bold border border-neutral-700"
                  >
                    Exact ({currency}{total.toFixed(0)})
                  </button>
                  {[100, 500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickCash(amt)}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-mono font-semibold border border-neutral-700"
                    >
                      {currency}{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change calculation */}
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-300">Change Due:</span>
                <span className={`text-2xl font-mono font-extrabold ${changeDue > 0 ? 'text-yellow-400' : 'text-neutral-500'}`}>
                  {currency}{changeDue.toFixed(0)}
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
        <div className="px-6 py-4 bg-[#171717] border-t border-neutral-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCompleteOrder}
            disabled={isSubmitting || !isTenderSufficient}
            className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center space-x-2 transition-all ${
              isSubmitting || !isTenderSufficient
                ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/25'
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
