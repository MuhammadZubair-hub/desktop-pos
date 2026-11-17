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
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#0A0A0A] p-6 space-y-6">
      {/* 1. Daily Sales Summary */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3 flex items-center space-x-2">
          <History className="w-4 h-4 text-yellow-400" />
          <span>Daily Business Performance</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {/* Revenue */}
          <div className="bg-[#121212] border border-neutral-800 rounded-xl p-4">
            <span className="text-[11px] font-bold text-neutral-400 uppercase">Today's Sales</span>
            <div className="text-2xl font-black font-mono text-yellow-400 mt-1">
              {currency}{(salesSummary?.totalRevenue || 0).toFixed(0)}
            </div>
          </div>

          {/* Orders */}
          <div className="bg-[#121212] border border-neutral-800 rounded-xl p-4">
            <span className="text-[11px] font-bold text-neutral-400 uppercase">Orders / Invoices</span>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {salesSummary?.orderCount || 0}
            </div>
          </div>

          {/* Average Basket */}
          <div className="bg-[#121212] border border-neutral-800 rounded-xl p-4">
            <span className="text-[11px] font-bold text-neutral-400 uppercase">Avg Bill Value</span>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {currency}{(salesSummary?.averageOrderValue || 0).toFixed(0)}
            </div>
          </div>

          {/* Cash Sales */}
          <div className="bg-[#121212] border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">Cash Revenue</span>
              <Banknote className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {currency}{(salesSummary?.cashRevenue || 0).toFixed(0)}
            </div>
          </div>

          {/* Card Sales */}
          <div className="bg-[#121212] border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">Card Revenue</span>
              <CreditCard className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {currency}{(salesSummary?.cardRevenue || 0).toFixed(0)}
            </div>
          </div>

          {/* Source Breakdown */}
          <div className="bg-[#121212] border border-neutral-800 rounded-xl p-4">
            <span className="text-[11px] font-bold text-neutral-400 uppercase">Terminal Origin</span>
            <div className="flex items-center space-x-2 mt-2 text-xs font-mono font-bold">
              <span className="flex items-center space-x-1 text-white">
                <Monitor className="w-3 h-3 text-yellow-400" />
                <span>{salesSummary?.desktopOrders || 0} POS</span>
              </span>
              <span className="text-neutral-600">|</span>
              <span className="flex items-center space-x-1 text-yellow-400">
                <Smartphone className="w-3 h-3 text-yellow-400" />
                <span>{salesSummary?.mobileOrders || 0} App</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Live Wi-Fi Connection & Mobile Pairing Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#121212] border border-neutral-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base">Local Wi-Fi Server (Offline LAN)</h4>
                <p className="text-xs text-neutral-400">Connect mobile companion devices via local Wi-Fi without internet</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full text-yellow-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span>Server Online : Port 5000</span>
            </div>
          </div>

          {/* Connection Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
            {/* IP Address */}
            <div className="bg-[#171717] border border-neutral-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span className="font-semibold">Desktop LAN IP</span>
                <button
                  onClick={() => copyToClipboard(primaryIp, 'ip')}
                  className="text-neutral-400 hover:text-yellow-400 p-1"
                  title="Copy IP"
                >
                  {copiedField === 'ip' ? <Check className="w-3.5 h-3.5 text-yellow-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-lg font-mono font-black text-white truncate">
                {primaryIp}
              </div>
              <span className="text-[10px] text-yellow-400/80 font-mono">Port 5000 (REST & WS)</span>
            </div>

            {/* UDP Beacon */}
            <div className="bg-[#171717] border border-neutral-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span className="font-semibold">UDP Broadcast</span>
                <Radio className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              </div>
              <div className="text-lg font-mono font-black text-yellow-400">
                Port 5001
              </div>
              <span className="text-[10px] text-neutral-400">Beaconing every 3s</span>
            </div>

            {/* Pairing PIN */}
            <div className="bg-[#171717] border border-neutral-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span className="font-semibold">Pairing PIN</span>
                {!isEditingPin && (
                  <button
                    onClick={() => setIsEditingPin(true)}
                    className="text-yellow-400 hover:text-yellow-300 p-1"
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
                    className="w-24 bg-neutral-900 border border-yellow-400 rounded px-2 py-0.5 text-sm font-mono text-white focus:outline-none"
                    maxLength={8}
                  />
                  <button
                    onClick={handleSavePin}
                    className="p-1 rounded bg-yellow-400 text-black font-bold hover:bg-yellow-300"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setPinInput(currentPin);
                      setIsEditingPin(false);
                    }}
                    className="p-1 rounded text-neutral-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-lg font-mono font-black text-yellow-400 tracking-wider">
                    {currentPin}
                  </div>
                  <button
                    onClick={() => copyToClipboard(currentPin, 'pin')}
                    className="text-neutral-400 hover:text-yellow-400 p-1"
                  >
                    {copiedField === 'pin' ? <Check className="w-3.5 h-3.5 text-yellow-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
              <span className="text-[10px] text-neutral-400">Authenticates mobile app</span>
            </div>
          </div>

          {/* Explanatory banner */}
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-300 flex items-start space-x-2.5">
            <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
            <div>
              <p className="font-bold text-white">Zero-Cloud Wi-Fi Sync Active</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Launch the mobile app on any phone connected to the same Wi-Fi router. The app will auto-discover this desktop server. Enter PIN <span className="font-mono text-yellow-400 font-bold">{currentPin}</span> when prompted.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Database Backup Management Panel */}
        <div className="bg-[#121212] border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm">Offline SQLite Database</h4>
                <p className="text-[11px] text-neutral-400">Crash-Safe WAL Mode + Backups</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-neutral-300 my-4 bg-[#171717] p-3 rounded-xl border border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Storage Engine:</span>
                <span className="font-mono font-semibold text-white">better-sqlite3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Journal Mode:</span>
                <span className="font-mono font-semibold text-yellow-400">PRAGMA WAL;</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Auto-Backup:</span>
                <span className="text-yellow-400 font-semibold">Daily & On App Exit</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Stored Backups:</span>
                <span className="font-mono font-semibold text-white">{backupsList.length} snapshots</span>
              </div>
            </div>

            {backupMessage && (
              <div className="p-2.5 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-[11px] text-yellow-400 mb-3 flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                <span>{backupMessage}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleBackupNow}
            disabled={isBackingUp}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-yellow-400 hover:text-yellow-300 font-extrabold py-2.5 px-4 rounded-xl border border-neutral-700 flex items-center justify-center space-x-2 text-xs transition-colors"
          >
            <Download className="w-4 h-4 text-yellow-400" />
            <span>{isBackingUp ? 'Creating Backup...' : 'Take Instant Backup Now'}</span>
          </button>
        </div>
      </div>

      {/* 4. Order History Table */}
      <div className="bg-[#121212] border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-[#171717]">
          <div>
            <h4 className="font-extrabold text-white text-base">Sales Order History</h4>
            <p className="text-xs text-neutral-400">Real-time log of desktop and mobile transactions</p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            Showing last {orders.length} orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171717] text-neutral-400 uppercase font-semibold border-b border-neutral-800">
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
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-neutral-500">
                    No orders recorded yet. Completed sales will appear here in real time.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-white">
                      {o.invoice_no}
                    </td>
                    <td className="px-5 py-3.5 text-neutral-400">
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
                            ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30'
                            : 'bg-neutral-800 text-white border border-neutral-700'
                        }`}
                      >
                        {o.source === 'MOBILE' ? <Smartphone className="w-3 h-3 text-yellow-400" /> : <Monitor className="w-3 h-3 text-neutral-400" />}
                        <span>{o.source}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono text-[11px] font-bold text-white">
                        {o.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono">
                      {o.items?.reduce((sum, item) => sum + item.qty, 0) || 0}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-black text-yellow-400 text-sm">
                      {currency}{o.total.toFixed(0)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedReceiptOrder(o)}
                        className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg inline-flex items-center space-x-1 transition-colors border border-neutral-800"
                      >
                        <Printer className="w-3.5 h-3.5 text-yellow-400" />
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
