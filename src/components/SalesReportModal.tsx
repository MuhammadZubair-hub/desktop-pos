import React from 'react';
import { Printer, X, Download, Calendar, DollarSign, ShoppingBag, Check } from 'lucide-react';
import { SalesReportData } from '../types/pos';
import { usePOS } from '../context/POSContext';

interface SalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: SalesReportData | null;
}

export const SalesReportModal: React.FC<SalesReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
}) => {
  const { settings } = usePOS();
  if (!isOpen || !reportData) return null;

  const storeName = settings.store_name || "OCTOPIZZA'S Fast Food";
  const storeAddress = settings.store_address || 'Dhobi Ghat Stop Sunny Biscuit Factory Road Near Cheema Plaza, Lahore';
  const storePhone = settings.store_phone || '0335-6305006 / 0329-9447488';
  const currency = settings.currency_symbol || 'Rs. ';

  const handlePrint = () => {
    window.print();
  };

  const generatedDate = new Date().toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const { summary, categorySales, topProducts, filter, orders } = reportData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Actions */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <h3 className="text-base font-black text-slate-900">
              Sales Report Preview ({filter.displayRange})
            </h3>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4 stroke-[2.2]" />
              <span>Print Report (A4 / POS)</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Printable Report Content Container */}
        <div className="p-8 overflow-y-auto bg-slate-100 flex justify-center">
          <div
            id="sales-report-print"
            className="w-full max-w-[800px] bg-white text-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0"
          >
            {/* Header: Store Info & Brand Logo */}
            <div className="pb-5 border-b-2 border-slate-900">
              <div className="flex items-center justify-center space-x-4">
                <img
                  src="/images/logo.png"
                  alt="OCTOPIZZA'S"
                  className="w-16 h-16 object-contain rounded-2xl shadow-sm border border-slate-200"
                />
                <div className="text-left">
                  <h1 className="text-2xl font-black tracking-wide uppercase text-slate-950">
                    {storeName}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">{storeAddress}</p>
                  <p className="text-xs font-bold text-slate-800">Phone: {storePhone}</p>
                </div>
              </div>
              <div className="mt-3 text-center">
                <span className="inline-block px-3 py-1 bg-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-md">
                  {filter.period.toUpperCase()} SALES AUDIT & REVENUE REPORT
                </span>
              </div>
            </div>

            {/* Meta Information Bar */}
            <div className="py-4 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                <span className="font-bold text-slate-900">Report Period: </span>
                <span className="font-mono">{filter.displayRange}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Printed On: </span>
                <span>{generatedDate}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Terminal: </span>
                <span>Desktop Host System</span>
              </div>
            </div>

            {/* Executive Financial Summary Grid */}
            <div className="my-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2.5">
                1. Executive Financial Summary
              </h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Net Revenue</div>
                  <div className="text-lg font-black font-mono text-slate-950 mt-0.5">
                    {currency}{summary.totalRevenue.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Invoices / Orders</div>
                  <div className="text-lg font-black font-mono text-slate-950 mt-0.5">
                    {summary.orderCount} Orders
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Avg Bill Value</div>
                  <div className="text-lg font-black font-mono text-slate-950 mt-0.5">
                    {currency}{summary.averageOrderValue.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Total Items Sold</div>
                  <div className="text-lg font-black font-mono text-slate-950 mt-0.5">
                    {summary.itemsSoldTotal} Items
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Cash Collections</div>
                  <div className="text-base font-black font-mono text-slate-900 mt-0.5">
                    {currency}{summary.cashRevenue.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Card Collections</div>
                  <div className="text-base font-black font-mono text-slate-900 mt-0.5">
                    {currency}{summary.cardRevenue.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Total Discounts</div>
                  <div className="text-base font-black font-mono text-slate-900 mt-0.5">
                    {currency}{summary.totalDiscount.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Channel Orders</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    💻 {summary.desktopOrders} POS | 📱 {summary.mobileOrders} App
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="my-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                2. Category Revenue Breakdown
              </h4>
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 font-bold text-slate-700 uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Menu Category</th>
                    <th className="py-2 px-3 text-center">Items Sold</th>
                    <th className="py-2 px-3 text-right">Revenue</th>
                    <th className="py-2 px-3 text-right">% Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {categorySales.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{cat.categoryName}</td>
                      <td className="py-2 px-3 text-center font-mono">{cat.itemsSold}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {currency}{cat.revenue.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                        {cat.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top 5 Best Selling Items */}
            <div className="my-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                3. Top Best-Selling Products
              </h4>
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 font-bold text-slate-700 uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Rank & Product Name</th>
                    <th className="py-2 px-3 text-center">Quantity Sold</th>
                    <th className="py-2 px-3 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {topProducts.slice(0, 5).map((prod, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">
                        #{idx + 1}. {prod.productName}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold">{prod.qtySold} units</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {currency}{prod.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signature Block */}
            <div className="mt-10 pt-6 border-t-2 border-slate-300 flex justify-between text-xs text-slate-600">
              <div className="text-center w-48">
                <div className="border-b border-slate-400 pb-8 mb-1.5" />
                <span className="font-bold text-slate-900">Cashier / Staff Signature</span>
              </div>
              <div className="text-center w-48">
                <div className="border-b border-slate-400 pb-8 mb-1.5" />
                <span className="font-bold text-slate-900">Manager / Auditor Approval</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-[10px] text-slate-400 font-mono">
              OCTOPIZZA'S POS • Offline Monorepo System • Certified Internal Sales Audit
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
