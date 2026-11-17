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
  is_active: number; // 1 or 0
  updated_at: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'OTHER';
export type OrderSource = 'DESKTOP' | 'MOBILE';
export type OrderStatus = 'COMPLETED' | 'REFUNDED' | 'CANCELLED';

export interface Order {
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
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface Setting {
  key: string;
  value: string;
}

export interface CreateOrderItemInput {
  productId: number;
  productName: string;
  qty: number;
  unitPrice: number;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  paymentMethod: PaymentMethod;
  discount?: number;
  tax?: number;
  source: OrderSource;
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

// Reports & Analytics Types
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
  label: string; // e.g. "14:00" or "2026-11-17"
  orders: number;
  revenue: number;
}

export interface SalesReportFilter {
  period?: 'daily' | 'weekly' | 'monthly' | 'custom';
  date?: string; // YYYY-MM-DD
  month?: string; // YYYY-MM
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
