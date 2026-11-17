import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Banknote,
  Smartphone,
  Monitor,
  Wifi,
  Radio,
  Key,
  Database,
  Download,
  Copy,
  Check,
  Edit2,
  Save,
  Printer,
  History,
  ShieldCheck,
  X,
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

  const currency = settings.currency_symbol || '$';
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
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-6 space-y-6">
      {/* 1. Daily Sales Summary */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
          <History className="w-4 h-4 text-blue-400" />
          <span>Today's Business Summary</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {/* Revenue */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Today's Revenue</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {currency}{(salesSummary?.totalRevenue || 0).toFixed(2)}
            </div>
          </div>

          {/* Orders */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Invoices</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {salesSummary?.orderCount || 0}
            </div>
          </div>

          {/* Average Basket */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg Order Value</span>
            <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
              {currency}{(salesSummary?.averageOrderValue || 0).toFixed(2)}
            </div>
          </div>

          {/* Cash Sales */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Cash Sales</span>
              <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
              {currency}{(salesSummary?.cashRevenue || 0).toFixed(2)}
            </div>
          </div>

          {/* Card Sales */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Card Sales</span>
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-300 mt-1">
              {currency}{(salesSummary?.cardRevenue || 0).toFixed(2)}
            </div>
          </div>

          {/* Source Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Order Sources</span>
            <div className="flex items-center space-x-2 mt-2 text-xs font-mono">
              <span className="flex items-center space-x-1 text-slate-300">
                <Monitor className="w-3 h-3 text-blue-400" />
                <span>{salesSummary?.desktopOrders || 0}</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center space-x-1 text-cyan-300">
                <Smartphone className="w-3 h-3 text-cyan-400" />
                <span>{salesSummary?.mobileOrders || 0}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Live Wi-Fi Connection & Mobile Pairing Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-850 border border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Local Wi-Fi Host Network Panel</h4>
                <p className="text-xs text-slate-400">Connect mobile companion POS devices over your local Wi-Fi router</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Host Live: Port 5000</span>
            </div>
          </div>

          {/* Connection Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
            {/* IP Address */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-medium">Desktop Host LAN IP</span>
                <button
                  onClick={() => copyToClipboard(primaryIp, 'ip')}
                  className="text-blue-400 hover:text-blue-300 p-1"
                  title="Copy IP"
                >
                  {copiedField === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-lg font-mono font-bold text-white truncate">
                {primaryIp}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">TCP Port 5000</span>
            </div>

            {/* UDP Beacon */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-medium">UDP Auto-Discovery</span>
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              </div>
              <div className="text-lg font-mono font-bold text-cyan-400">
                Port 5001
              </div>
              <span className="text-[10px] text-slate-500">Broadcasting every 3s</span>
            </div>

            {/* Pairing PIN */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-medium">Mobile Pairing PIN</span>
                {!isEditingPin && (
                  <button
                    onClick={() => setIsEditingPin(true)}
                    className="text-amber-400 hover:text-amber-300 p-1"
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
                    className="w-24 bg-slate-800 border border-amber-500 rounded px-2 py-0.5 text-sm font-mono text-white focus:outline-none"
                    maxLength={8}
                  />
                  <button
                    onClick={handleSavePin}
                    className="p-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setPinInput(currentPin);
                      setIsEditingPin(false);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-lg font-mono font-bold text-amber-400 tracking-wider">
                    {currentPin}
                  </div>
                  <button
                    onClick={() => copyToClipboard(currentPin, 'pin')}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    {copiedField === 'pin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
              <span className="text-[10px] text-slate-500">Secures local LAN requests</span>
            </div>
          </div>

          {/* Explanatory banner */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-start space-x-2.5">
            <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
            <div>
              <p className="font-semibold">Zero-Config Mobile Discovery Active</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Launch the companion mobile app on any iPhone or Android connected to the same Wi-Fi. The app will automatically discover this PC on UDP port 5001. Enter the Pairing PIN <span className="font-mono text-amber-400 font-bold">{currentPin}</span> when prompted.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Database Backup Management Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Crash-Safe Local SQLite</h4>
                <p className="text-[11px] text-slate-400">WAL Mode + Automatic Local Backups</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 my-4 bg-slate-850 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Database Engine:</span>
                <span className="font-mono font-semibold text-white">better-sqlite3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Journal Mode:</span>
                <span className="font-mono font-semibold text-emerald-400">PRAGMA WAL;</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Auto-Backup:</span>
                <span className="text-emerald-400 font-medium">Daily & On App Exit</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Backups Available:</span>
                <span className="font-mono font-semibold text-white">{backupsList.length} snapshots</span>
              </div>
            </div>

            {backupMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 mb-3 flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{backupMessage}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleBackupNow}
            disabled={isBackingUp}
            className="w-full bg-slate-800 hover:bg-slate-750 text-white font-semibold py-2.5 px-4 rounded-xl border border-slate-700 flex items-center justify-center space-x-2 text-xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isBackingUp ? 'Creating SQLite Backup...' : 'Create Instant Backup Now'}</span>
          </button>
        </div>
      </div>

      {/* 4. Order History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-white text-base">Sales Order History</h4>
            <p className="text-xs text-slate-400">Real-time log of desktop and mobile transactions</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing last {orders.length} transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3 text-center">Terminal Source</th>
                <th className="px-5 py-3 text-center">Payment</th>
                <th className="px-5 py-3 text-center">Items</th>
                <th className="px-5 py-3 text-right">Total Amount</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No orders recorded yet. Completed sales will appear here in real time.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-white">
                      {o.invoice_no}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
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
                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                            : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                        }`}
                      >
                        {o.source === 'MOBILE' ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                        <span>{o.source}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] font-semibold text-slate-300">
                        {o.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono">
                      {o.items?.reduce((sum, item) => sum + item.qty, 0) || 0}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                      {currency}{o.total.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedReceiptOrder(o)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg inline-flex items-center space-x-1 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-400" />
                        <span>Receipt</span>
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
