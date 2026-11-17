import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Monitor,
  Wifi,
  Radio,
  Database,
  Download,
  Copy,
  Check,
  Edit2,
  Save,
  Printer,
  History,
  X,
  Server,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { OrderWithItems, BackupItem } from '../types/pos';
import { ReceiptModal } from '../components/ReceiptModal';

export const SalesNetworkView: React.FC = () => {
  const {
    salesSummary,
    orders,
    serverStatus,
    settings,
    updateSettingValue,
    triggerManualBackup,
  } = usePOS();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [backupsList, setBackupsList] = useState<BackupItem[]>([]);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<OrderWithItems | null>(null);

  const currency = settings.currency_symbol || 'Rs. ';
  const primaryIp = serverStatus?.primaryIp || '127.0.0.1';
  const currentPin = settings.pairing_pin || serverStatus?.pairingPin || '1234';

  useEffect(() => {
    setPinInput(currentPin);
    loadBackups();
  }, [currentPin]);

  const loadBackups = async () => {
    if (window.electronAPI) {
      try {
        const list = await window.electronAPI.getBackups();
        setBackupsList(list || []);
      } catch {}
    } else {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/backups');
        if (res.ok) {
          const list = await res.json();
          setBackupsList(list || []);
        }
      } catch {}
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSavePin = async () => {
    if (!pinInput.trim()) return;
    await updateSettingValue('pairing_pin', pinInput.trim());
    setIsEditingPin(false);
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    setBackupMessage(null);
    try {
      const result = await triggerManualBackup();
      setBackupMessage(result.message || 'Backup completed successfully!');
      loadBackups();
    } catch (err: any) {
      setBackupMessage(`Backup error: ${err.message}`);
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setBackupMessage(null), 5000);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#F8FAFC] p-6 space-y-6 select-none">
      {/* 1. Daily Sales Summary */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-2">
          <History className="w-4 h-4 text-slate-800" />
          <span>Today's Counter Performance</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {/* Revenue */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Today's Sales</span>
            <div className="text-2xl font-black font-mono text-slate-950 mt-1">
              {currency}{(salesSummary?.totalRevenue || 0).toFixed(0)}
            </div>
          </div>

          {/* Orders */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Orders / Invoices</span>
            <div className="text-2xl font-black font-mono text-slate-950 mt-1">
              {salesSummary?.orderCount || 0}
            </div>
          </div>

          {/* Average Basket */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Avg Bill Value</span>
            <div className="text-2xl font-black font-mono text-slate-950 mt-1">
              {currency}{(salesSummary?.averageOrderValue || 0).toFixed(0)}
            </div>
          </div>

          {/* Cash Sales */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Cash Revenue</span>
              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black font-mono text-slate-950 mt-1">
              {currency}{(salesSummary?.cashRevenue || 0).toFixed(0)}
            </div>
          </div>

          {/* Card Sales */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Card Revenue</span>
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-black font-mono text-slate-950 mt-1">
              {currency}{(salesSummary?.cardRevenue || 0).toFixed(0)}
            </div>
          </div>

          {/* Source Breakdown */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Terminal Origin</span>
            <div className="flex items-center space-x-2 mt-2 text-xs font-mono font-bold">
              <span className="flex items-center space-x-1 text-slate-900">
                <Monitor className="w-3 h-3 text-slate-600" />
                <span>{salesSummary?.desktopOrders || 0} POS</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center space-x-1 text-yellow-600">
                <Smartphone className="w-3 h-3 text-yellow-600" />
                <span>{salesSummary?.mobileOrders || 0} App</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Live Wi-Fi Connection & Mobile Pairing Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/20 text-slate-950 flex items-center justify-center font-bold">
                <Wifi className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">Local Wi-Fi Server (Offline Host)</h4>
                <p className="text-xs text-slate-500">Connect mobile companion devices via local Wi-Fi router without internet</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-emerald-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Server Online : Port 5000</span>
            </div>
          </div>

          {/* Connection Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
            {/* IP Address */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-bold">Desktop LAN IP</span>
                <button
                  onClick={() => copyToClipboard(primaryIp, 'ip')}
                  className="text-slate-500 hover:text-slate-900 p-1"
                  title="Copy IP"
                >
                  {copiedField === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-lg font-mono font-black text-slate-950 truncate">
                {primaryIp}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Port 5000 (REST & WS)</span>
            </div>

            {/* UDP Beacon */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-bold">UDP Broadcast</span>
                <Radio className="w-3.5 h-3.5 text-yellow-600 animate-pulse" />
              </div>
              <div className="text-lg font-mono font-black text-slate-950">
                Port 5001
              </div>
              <span className="text-[10px] text-slate-500">Broadcasting every 3s</span>
            </div>

            {/* Pairing PIN */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-bold">Pairing PIN</span>
                {!isEditingPin && (
                  <button
                    onClick={() => setIsEditingPin(true)}
                    className="text-yellow-600 hover:text-yellow-700 p-1 font-bold"
                    title="Edit PIN"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isEditingPin ? (
                <div className="flex items-center space-x-1.5 mt-1">
                  <input
                    type="text"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-24 bg-white border border-yellow-400 rounded-lg px-2 py-0.5 text-sm font-mono text-slate-900 outline-none"
                    maxLength={8}
                  />
                  <button
                    onClick={handleSavePin}
                    className="p-1 rounded bg-yellow-400 text-slate-950 font-bold hover:bg-yellow-300"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setPinInput(currentPin);
                      setIsEditingPin(false);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-lg font-mono font-black text-slate-950 tracking-wider">
                    {currentPin}
                  </div>
                  <button
                    onClick={() => copyToClipboard(currentPin, 'pin')}
                    className="text-slate-500 hover:text-slate-900 p-1"
                  >
                    {copiedField === 'pin' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
              <span className="text-[10px] text-slate-500">Authenticates mobile app</span>
            </div>
          </div>

          {/* Explanatory banner */}
          <div className="p-3.5 bg-yellow-400/10 border border-yellow-400/30 rounded-xl text-xs text-slate-800 flex items-start space-x-2.5">
            <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-slate-900" />
            <div>
              <p className="font-black text-slate-900">Zero-Cloud Wi-Fi Sync Active</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Launch the mobile app on any phone connected to the same Wi-Fi router. The app will auto-discover this desktop server. Enter PIN <span className="font-mono text-slate-950 font-black">{currentPin}</span> when prompted.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Database Backup Management Panel */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-400/20 text-slate-950 flex items-center justify-center font-bold">
                <Database className="w-4 h-4 text-slate-900" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">Offline SQLite Database</h4>
                <p className="text-[11px] text-slate-500">Crash-Safe WAL Mode + Backups</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-700 my-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Storage Engine:</span>
                <span className="font-mono font-bold text-slate-900">better-sqlite3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Journal Mode:</span>
                <span className="font-mono font-bold text-amber-600">PRAGMA WAL;</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Auto-Backup:</span>
                <span className="text-emerald-700 font-bold">Daily & On App Exit</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Stored Backups:</span>
                <span className="font-mono font-bold text-slate-900">{backupsList.length} snapshots</span>
              </div>
            </div>

            {backupMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 mb-3 flex items-center space-x-1.5 font-bold">
                <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                <span>{backupMessage}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleBackupNow}
            disabled={isBackingUp}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-black py-2.5 px-4 rounded-xl border border-slate-300 flex items-center justify-center space-x-2 text-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-700" />
            <span>{isBackingUp ? 'Creating Backup...' : 'Take Instant Backup Now'}</span>
          </button>
        </div>
      </div>

      {/* 4. Order History Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div>
            <h4 className="font-black text-slate-900 text-sm">Order Transactions Ledger</h4>
            <p className="text-xs text-slate-500">Real-time log of desktop and mobile transactions</p>
          </div>
          <span className="text-xs text-slate-500 font-mono font-bold">
            Showing last {orders.length} orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Bill / Invoice #</th>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3 text-center">Source</th>
                <th className="px-5 py-3 text-center">Payment</th>
                <th className="px-5 py-3 text-center">Items</th>
                <th className="px-5 py-3 text-right">Total Amount</th>
                <th className="px-5 py-3 text-right">Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No orders recorded yet. Completed sales will appear here in real time.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {o.invoice_no}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono">
                      {new Date(o.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-center">
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
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono text-[11px] font-bold text-slate-800">
                        {o.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono font-bold">
                      {o.items?.reduce((sum, item) => sum + item.qty, 0) || 0}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-black text-slate-950 text-sm">
                      {currency}{o.total.toFixed(0)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedReceiptOrder(o)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg inline-flex items-center space-x-1 transition-colors border border-slate-200 font-bold"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-700" />
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

      {/* Reprint Receipt Modal */}
      <ReceiptModal
        isOpen={selectedReceiptOrder !== null}
        order={selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
};
