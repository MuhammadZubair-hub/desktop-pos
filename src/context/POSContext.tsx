import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, Category, OrderWithItems, SalesSummary, ServerStatus, Setting } from '../types/pos';

interface POSContextType {
  products: Product[];
  categories: Category[];
  orders: OrderWithItems[];
  salesSummary: SalesSummary | null;
  serverStatus: ServerStatus | null;
  settings: Record<string, string>;
  isWsConnected: boolean;
  isLoading: boolean;
  refreshProducts: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshServerStatus: () => Promise<void>;
  updateSettingValue: (key: string, value: string) => Promise<void>;
  saveProduct: (product: Partial<Product>, id?: number) => Promise<Product>;
  adjustProductStock: (id: number, delta: number) => Promise<void>;
  submitOrder: (orderInput: any) => Promise<OrderWithItems>;
  triggerManualBackup: () => Promise<{ success: boolean; message: string }>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const API_BASE = 'http://127.0.0.1:5000/api';
const WS_URL = 'ws://127.0.0.1:5000/ws';

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({
    store_name: 'Metro Express Mart',
    pairing_pin: '1234',
    tax_rate: '8.5',
    currency_symbol: '$',
  });
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': settings.pairing_pin || '1234',
    };
  }, [settings.pairing_pin]);

  const refreshProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/products`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.warn('[POSContext] Could not fetch products:', err);
    }
  }, [getHeaders]);

  const refreshOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/orders?limit=50`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setSalesSummary(data.summary || null);
      }
    } catch (err) {
      console.warn('[POSContext] Could not fetch orders:', err);
    }
  }, [getHeaders]);

  const refreshServerStatus = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const status = await window.electronAPI.getServerStatus();
        setServerStatus(status);
        const s = await window.electronAPI.getSettings();
        if (s) setSettings((prev) => ({ ...prev, ...s }));
      } else {
        const res = await fetch(`${API_BASE}/ping`);
        if (res.ok) {
          const pingData = await res.json();
          setServerStatus((prev) => ({
            ...(prev || {}),
            status: 'ONLINE',
            serverName: pingData.name,
            port: pingData.port,
            primaryIp: pingData.primaryIp,
            localIps: pingData.localIps || [],
            pairingPin: '1234',
            activeWsClients: 0,
            udpBeacon: {
              active: true,
              targetPort: 5001,
              intervalMs: 3000,
              lastBroadcast: Date.now(),
              broadcastCount: 1,
              hostIp: pingData.primaryIp,
            },
            timestamp: pingData.timestamp,
          }));
        }
      }
    } catch (err) {
      console.warn('[POSContext] Could not fetch server status:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await Promise.allSettled([
        refreshProducts(),
        refreshOrders(),
        refreshServerStatus(),
      ]);
      setIsLoading(false);
    }
    init();

    // Poll status every 10s
    const statusInterval = setInterval(refreshServerStatus, 10000);
    return () => clearInterval(statusInterval);
  }, [refreshProducts, refreshOrders, refreshServerStatus]);

  // WebSocket Live Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          setIsWsConnected(true);
          console.log('[POSContext] WebSocket connected to host');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            switch (data.type) {
              case 'NEW_ORDER': {
                const newOrder: OrderWithItems = data.payload;
                setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
                refreshOrders();
                refreshProducts();
                break;
              }
              case 'STOCK_UPDATED': {
                const { productId, stock_qty } = data.payload;
                setProducts((prev) =>
                  prev.map((p) => (p.id === productId ? { ...p, stock_qty } : p))
                );
                break;
              }
              case 'PRODUCT_UPDATED':
              case 'PRODUCT_ADDED': {
                refreshProducts();
                break;
              }
              case 'SETTINGS_UPDATED': {
                setSettings((prev) => ({ ...prev, ...data.payload }));
                break;
              }
              default:
                break;
            }
          } catch (err) {
            console.error('[POSContext] Error parsing WS message:', err);
          }
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setIsWsConnected(false);
          ws?.close();
        };
      } catch {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [refreshOrders, refreshProducts]);

  const updateSettingValue = async (key: string, value: string) => {
    if (window.electronAPI) {
      await window.electronAPI.updateSetting(key, value);
    } else {
      await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ [key]: value }),
      });
    }
    setSettings((prev) => ({ ...prev, [key]: value }));
    refreshServerStatus();
  };

  const saveProduct = async (product: Partial<Product>, id?: number): Promise<Product> => {
    const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(product),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save product');
    }

    const saved = await res.json();
    await refreshProducts();
    return saved;
  };

  const adjustProductStock = async (id: number, delta: number) => {
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock_qty: Math.max(0, p.stock_qty + delta) } : p))
    );

    await fetch(`${API_BASE}/products/${id}/stock`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ delta }),
    });
  };

  const submitOrder = async (orderInput: any): Promise<OrderWithItems> => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderInput),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit order');
    }

    const order: OrderWithItems = await res.json();
    await refreshOrders();
    await refreshProducts();
    return order;
  };

  const triggerManualBackup = async (): Promise<{ success: boolean; message: string }> => {
    if (window.electronAPI) {
      return await window.electronAPI.triggerBackup();
    }
    const res = await fetch(`${API_BASE}/backup`, { method: 'POST', headers: getHeaders() });
    return await res.json();
  };

  return (
    <POSContext.Provider
      value={{
        products,
        categories,
        orders,
        salesSummary,
        serverStatus,
        settings,
        isWsConnected,
        isLoading,
        refreshProducts,
        refreshOrders,
        refreshServerStatus,
        updateSettingValue,
        saveProduct,
        adjustProductStock,
        submitOrder,
        triggerManualBackup,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) throw new Error('usePOS must be used within a POSProvider');
  return context;
};
