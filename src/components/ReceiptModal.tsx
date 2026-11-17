import React from 'react';
import { Printer, Check, X, QrCode } from 'lucide-react';
import { OrderWithItems } from '../types/pos';
import { usePOS } from '../context/POSContext';

interface ReceiptModalProps {
  order: OrderWithItems | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, isOpen, onClose }) => {
  const { settings } = usePOS();
  if (!isOpen || !order) return null;

  const storeName = settings.store_name || 'Metro Express Mart';
  const storeAddress = settings.store_address || '101 Commercial Ave, Suite 4';
  const storePhone = settings.store_phone || '+1 (555) 019-2834';
  const currency = settings.currency_symbol || '$';

  const handlePrint = () => {
    if (window.electronAPI) {
      window.electronAPI.printReceipt(order);
    } else {
      window.print();
    }
  };

  const formattedDate = new Date(order.created_at).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Actions */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h3 className="text-sm font-bold text-white">Order Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Box */}
        <div className="p-6 bg-slate-950/70 overflow-y-auto max-h-[70vh] flex justify-center">
          <div
            id="thermal-receipt"
            className="w-full max-w-[320px] bg-white text-slate-900 font-mono text-[11px] p-5 rounded shadow-lg border border-slate-200"
          >
            {/* Store Info */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="font-bold text-base tracking-wide uppercase">{storeName}</h2>
              <p className="text-[10px] text-slate-600 mt-0.5">{storeAddress}</p>
              <p className="text-[10px] text-slate-600">{storePhone}</p>
              <div className="mt-2 inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-700 uppercase">
                {order.source} Terminal
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-bold">{order.invoice_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-bold">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-700 font-bold">{order.status}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase pb-1.5 border-b border-slate-200">
                <span className="w-1/2">Item</span>
                <span className="w-1/4 text-center">Qty</span>
                <span className="w-1/4 text-right">Total</span>
              </div>

              <div className="space-y-1.5 pt-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-baseline leading-tight">
                    <div className="w-1/2 truncate pr-1">
                      <span className="font-semibold">{item.product_name}</span>
                      <div className="text-[9px] text-slate-500">{currency}{item.unit_price.toFixed(2)}</div>
                    </div>
                    <span className="w-1/4 text-center">{item.qty}</span>
                    <span className="w-1/4 text-right font-bold">
                      {currency}{item.line_total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{currency}{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Discount:</span>
                  <span>-{currency}{order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax:</span>
                  <span>+{currency}{order.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>{currency}{order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer barcode/note */}
            <div className="text-center pt-3 space-y-1">
              <p className="font-bold text-[10px]">*** THANK YOU FOR SHOPPING! ***</p>
              <p className="text-[9px] text-slate-500">Please retain receipt for exchanges/returns</p>
              <div className="pt-2 flex justify-center opacity-80">
                <div className="tracking-widest font-mono text-[9px] border-t border-b border-slate-800 py-0.5">
                  *{order.invoice_no}*
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-3 rounded-xl text-xs transition-colors"
          >
            New Transaction
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
