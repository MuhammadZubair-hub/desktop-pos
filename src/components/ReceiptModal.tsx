import React from 'react';
import { Printer, Check, X } from 'lucide-react';
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

  const storeName = settings.store_name || "OCTOPIZZA'S Fast Food";
  const storeAddress = settings.store_address || 'Dhobi Ghat Stop Sunny Biscuit Factory Road Near Cheema Plaza, Lahore';
  const storePhone = settings.store_phone || '0335-6305006 / 0329-9447488';
  const currency = settings.currency_symbol || 'Rs. ';

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
      <div className="bg-[#121212] border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Actions */}
        <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between bg-[#171717]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <h3 className="text-sm font-bold text-white">Thermal Bill Preview</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Box */}
        <div className="p-6 bg-[#0A0A0A] overflow-y-auto max-h-[70vh] flex justify-center">
          <div
            id="thermal-receipt"
            className="w-full max-w-[320px] bg-white text-black font-mono text-[11px] p-5 rounded shadow-xl border border-neutral-300"
          >
            {/* Store Info & Brand Logo */}
            <div className="text-center pb-3 border-b border-dashed border-neutral-400">
              <div className="flex justify-center mb-2">
                <img
                  src="/images/logo.png"
                  alt="OCTOPIZZA'S"
                  className="w-14 h-14 object-contain rounded-full border border-neutral-200"
                />
              </div>
              <h2 className="font-black text-lg tracking-wide uppercase">{storeName}</h2>
              <p className="text-[10px] text-neutral-600 font-sans mt-0.5 leading-tight">{storeAddress}</p>
              <p className="text-[10px] text-neutral-800 font-bold mt-1">Ph: {storePhone}</p>
              <div className="mt-2 inline-block px-2.5 py-0.5 bg-neutral-100 rounded text-[9px] font-bold text-neutral-800 uppercase tracking-wider border border-neutral-300">
                {order.source} ORDER
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Bill #:</span>
                <span className="font-bold">{order.invoice_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Date:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Payment:</span>
                <span className="font-bold">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Status:</span>
                <span className="font-bold text-emerald-700">{order.status}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="py-3 border-b border-dashed border-neutral-400">
              <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase pb-1.5 border-b border-neutral-200">
                <span className="w-1/2">Item</span>
                <span className="w-1/4 text-center">Qty</span>
                <span className="w-1/4 text-right">Total</span>
              </div>

              <div className="space-y-1.5 pt-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-baseline leading-tight">
                    <div className="w-1/2 truncate pr-1">
                      <span className="font-bold">{item.product_name}</span>
                      <div className="text-[9px] text-neutral-500">{currency}{item.unit_price.toFixed(0)}</div>
                    </div>
                    <span className="w-1/4 text-center">{item.qty}</span>
                    <span className="w-1/4 text-right font-bold">
                      {currency}{item.line_total.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span>{currency}{order.subtotal.toFixed(0)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Discount:</span>
                  <span>-{currency}{order.discount.toFixed(0)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Tax:</span>
                  <span>+{currency}{order.tax.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-base pt-1 border-t border-neutral-300">
                <span>TOTAL:</span>
                <span>{currency}{order.total.toFixed(0)}</span>
              </div>
            </div>

            {/* Footer barcode/note */}
            <div className="text-center pt-3 space-y-1">
              <p className="font-black text-[11px]">THANK YOU FOR YOUR VISIT!</p>
              <p className="text-[9px] text-neutral-500">Delicious Pizza & Fast Food at your service</p>
              <div className="pt-2 flex justify-center">
                <div className="tracking-widest font-mono text-[10px] border-t border-b border-neutral-800 py-0.5 font-bold">
                  *{order.invoice_no}*
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print / Done Actions */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-[#171717] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-yellow-400/20 transition-all"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
