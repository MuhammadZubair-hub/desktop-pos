export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  cost_price: number;
  stock_qty: number;
  category_id: number | null;
  category_name?: string;
  is_active: number;
  updated_at: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'OTHER';
export type OrderSource = 'DESKTOP' | 'MOBILE';
export type OrderStatus = 'COMPLETED' | 'REFUNDED' | 'CANCELLED';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

export interface OrderWithItems {
  id: number;
  invoice_no: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  source: OrderSource;
  status: OrderStatus;
  created_at: string;
  items: OrderItem[];
}

export interface CartItem {
  product: Product;
  qty: number;
  unitPrice: number;
}

export interface Setting {
  key: string;
  value: string;
}

export interface SalesSummary {
  totalRevenue: number;
  orderCount: number;
  cashRevenue: number;
  cardRevenue: number;
  otherRevenue: number;
  desktopOrders: number;
  mobileOrders: number;
  averageOrderValue: number;
}

export interface ServerStatus {
  status: string;
  serverName: string;
  port: number;
  primaryIp: string;
  localIps: Array<{ interfaceName: string; ip: string }>;
  pairingPin: string;
  activeWsClients: number;
  udpBeacon: {
    active: boolean;
    targetPort: number;
    intervalMs: number;
    lastBroadcast: number;
    broadcastCount: number;
    hostIp: string;
  };
  timestamp: number;
}

export interface BackupItem {
  name: string;
  size: number;
  date: string;
  path: string;
}

export interface CategorySalesItem {
  categoryName: string;
  itemsSold: number;
  revenue: number;
  percentage?: number;
}

export interface TopProductItem {
  productName: string;
  qtySold: number;
  revenue: number;
}

export interface TimeTrendItem {
  label: string;
  orders: number;
  revenue: number;
}

export interface SalesReportFilter {
  period?: 'daily' | 'weekly' | 'monthly' | 'custom';
  date?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
}

export interface SalesReportData {
  filter: {
    period: 'daily' | 'weekly' | 'monthly' | 'custom';
    displayRange: string;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRevenue: number;
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    orderCount: number;
    averageOrderValue: number;
    cashRevenue: number;
    cardRevenue: number;
    otherRevenue: number;
    desktopOrders: number;
    mobileOrders: number;
    itemsSoldTotal: number;
  };
  categorySales: CategorySalesItem[];
  topProducts: TopProductItem[];
  trend: TimeTrendItem[];
  orders: OrderWithItems[];
}

declare global {
  interface Window {
    electronAPI?: {
      getServerStatus: () => Promise<ServerStatus>;
      triggerBackup: () => Promise<{ success: boolean; filePath: string; message: string }>;
      getBackups: () => Promise<BackupItem[]>;
      getSettings: () => Promise<Record<string, string>>;
      updateSetting: (key: string, value: string) => Promise<any>;
      getSalesReport: (filter?: SalesReportFilter) => Promise<SalesReportData>;
      printReceipt: (receiptData: any) => Promise<any>;
      onServerEvent: (callback: (event: any) => void) => () => void;
      platform: string;
    };
  }
}
