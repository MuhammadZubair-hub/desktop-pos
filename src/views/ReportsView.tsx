import React, { useState, useEffect } from 'react';
import {
  Calendar,
  BarChart3,
  TrendingUp,
  Printer,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  Monitor,
  Package,
  Layers,
  Clock,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { SalesReportData, SalesReportFilter, OrderWithItems } from '../types/pos';
import { SalesReportModal } from '../components/SalesReportModal';
import { ReceiptModal } from '../components/ReceiptModal';

export const ReportsView: React.FC = () => {
  const { fetchSalesReport, settings } = usePOS();
  const currency = settings.currency_symbol || 'Rs. ';

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<OrderWithItems | null>(null);

  // Load report data whenever period or filters change
  useEffect(() => {
    loadReport();
  }, [period, selectedDate, selectedMonth, startDate, endDate]);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const filter: SalesReportFilter = {
        period,
        date: period === 'daily' ? selectedDate : undefined,
        month: period === 'monthly' ? selectedMonth : undefined,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined,
      };

      const data = await fetchSalesReport(filter);
      setReportData(data);
    } catch (err) {
      console.error('[ReportsView] Error loading sales report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const summary = reportData?.summary;
  const categorySales = reportData?.categorySales || [];
  const topProducts = reportData?.topProducts || [];
  const trend = reportData?.trend || [];
  const orders = reportData?.orders || [];

  // Max value for trend bar normalization
  const maxTrendRevenue = Math.max(...trend.map((t) => t.revenue), 1);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#F8FAFC] p-6 space-y-6 select-none">
      {/* 1. Header & Timeframe Filter Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-400/20 text-slate-950 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4 text-slate-900" />
            </div>
            <h2 className="text-lg font-black text-slate-900">
              Sales Reports & Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate and audit daily, weekly, or monthly restaurant sales
          </p>
        </div>

        {/* Filters & Print CTA */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                period === 'daily'
                  ? 'bg-yellow-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Report
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                period === 'weekly'
                  ? 'bg-yellow-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                period === 'monthly'
                  ? 'bg-yellow-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Report
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                period === 'custom'
                  ? 'bg-yellow-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Conditional Date / Month Selectors */}
          {period === 'daily' && (
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-mono outline-none text-xs cursor-pointer"
              />
            </div>
          )}

          {period === 'monthly' && (
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-mono outline-none text-xs cursor-pointer"
              />
            </div>
          )}

          {period === 'custom' && (
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent outline-none"
              />
            </div>
          )}

          {/* Print Sales Report Button */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            disabled={isLoading || !reportData}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-yellow-400/25 transition-all active:scale-95 disabled:opacity-50"
          >
            <Printer className="w-4 h-4 stroke-[2.2]" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {/* Total Net Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Revenue</span>
            <div className="w-6 h-6 rounded-lg bg-yellow-400/20 flex items-center justify-center text-slate-950">
              <DollarSign className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-950 mt-1">
            {currency}{(summary?.totalRevenue || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">After all discounts</span>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Invoices / Orders</span>
            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <ShoppingBag className="w-3.5 h-3.5 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-950 mt-1">
            {summary?.orderCount || 0}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Total sales tickets</span>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Bill Value</span>
            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <TrendingUp className="w-3.5 h-3.5 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-950 mt-1">
            {currency}{(summary?.averageOrderValue || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Per invoice average</span>
        </div>

        {/* Cash Collections */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cash Collected</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black font-mono text-slate-950 mt-1">
            {currency}{(summary?.cashRevenue || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
            {summary?.totalRevenue ? Math.round((summary.cashRevenue / summary.totalRevenue) * 100) : 0}% of sales
          </span>
        </div>

        {/* Card Collections */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Card / Machine</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black font-mono text-slate-950 mt-1">
            {currency}{(summary?.cardRevenue || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-blue-600 font-bold block mt-0.5">
            {summary?.totalRevenue ? Math.round((summary.cardRevenue / summary.totalRevenue) * 100) : 0}% of sales
          </span>
        </div>

        {/* Total Items Sold */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Items Cooked</span>
            <Package className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-xl font-black font-mono text-slate-950 mt-1">
            {summary?.itemsSoldTotal || 0}
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-600 mt-1 font-mono">
            <span>💻 {summary?.desktopOrders || 0}</span>
            <span>•</span>
            <span>📱 {summary?.mobileOrders || 0}</span>
          </div>
        </div>
      </div>

      {/* 3. Mid Section: Category Revenue Share & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-slate-800" />
                <h4 className="text-sm font-black text-slate-900">Category Revenue Share</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {categorySales.length} Categories Sold
              </span>
            </div>

            {categorySales.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No category sales recorded for this timeframe.
              </div>
            ) : (
              <div className="space-y-3">
                {categorySales.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{cat.categoryName}</span>
                      <div className="flex items-center space-x-2 font-mono">
                        <span className="text-slate-500">{cat.itemsSold} items</span>
                        <span className="font-black text-slate-950">{currency}{cat.revenue.toLocaleString()}</span>
                        <span className="font-bold text-slate-600">({cat.percentage}%)</span>
                      </div>
                    </div>
                    {/* Visual Progress Bar in Golden Yellow */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, cat.percentage || 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top 10 Best-Selling Products */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-slate-800" />
                <h4 className="text-sm font-black text-slate-900">Top Selling Menu Items</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-400">Ranked by Volume</span>
            </div>

            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No item sales recorded for this timeframe.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-2 px-2.5">Rank & Item</th>
                      <th className="py-2 px-2.5 text-center">Units Sold</th>
                      <th className="py-2 px-2.5 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {topProducts.slice(0, 7).map((prod, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-2.5 font-bold flex items-center space-x-2">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-black ${
                            idx === 0 ? 'bg-yellow-400 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[200px]">{prod.productName}</span>
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-700">
                          {prod.qtySold}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-black text-slate-950">
                          {currency}{prod.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Sales Distribution Graph / Trend Visualization */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-800" />
            <h4 className="text-sm font-black text-slate-900">
              {period === 'daily' ? 'Hourly Sales Breakdown' : 'Daily Revenue Distribution'}
            </h4>
          </div>
          <span className="text-[11px] font-bold text-slate-400 font-mono">
            {reportData?.filter.displayRange}
          </span>
        </div>

        {trend.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No sales distribution data available.
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            <div className="h-32 flex items-end space-x-2 border-b border-slate-200 pb-2">
              {trend.map((point, idx) => {
                const heightPercent = Math.max(8, Math.round((point.revenue / maxTrendRevenue) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-950 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none transition-opacity whitespace-nowrap z-20">
                      {currency}{point.revenue.toLocaleString()} ({point.orders} orders)
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[36px] bg-yellow-400 group-hover:bg-yellow-300 rounded-t-lg transition-all shadow-xs"
                    />
                    <span className="text-[10px] font-mono text-slate-500 mt-2 truncate max-w-[45px]">
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Detailed Invoices & Transactions Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div>
            <h4 className="font-black text-slate-900 text-sm">Completed Invoices Log</h4>
            <p className="text-xs text-slate-500">Record of sales finalized during this period</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {orders.length} Invoices
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3 text-center">Source</th>
                <th className="px-5 py-3 text-center">Payment</th>
                <th className="px-5 py-3 text-center">Items</th>
                <th className="px-5 py-3 text-right">Discount</th>
                <th className="px-5 py-3 text-right">Net Bill</th>
                <th className="px-5 py-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No orders found for this timeframe.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">
                      {o.invoice_no}
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-mono">
                      {new Date(o.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          o.source === 'MOBILE'
                            ? 'bg-yellow-400/20 text-slate-950 border border-yellow-400/40'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {o.source === 'MOBILE' ? <Smartphone className="w-3 h-3 text-slate-900" /> : <Monitor className="w-3 h-3 text-slate-600" />}
                        <span>{o.source}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono text-[11px] font-bold text-slate-800">
                        {o.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center font-mono font-bold">
                      {o.items?.reduce((sum, item) => sum + item.qty, 0) || 0}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-500">
                      {o.discount > 0 ? `-${currency}${o.discount.toFixed(0)}` : '-'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-black text-slate-950 text-sm">
                      {currency}{o.total.toFixed(0)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelectedReceiptOrder(o)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg inline-flex items-center space-x-1 transition-colors border border-slate-200 font-bold"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Printable Sales Report Modal */}
      <SalesReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportData={reportData}
      />

      {/* 7. Thermal Receipt Reprint Modal */}
      <ReceiptModal
        isOpen={selectedReceiptOrder !== null}
        order={selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
};
