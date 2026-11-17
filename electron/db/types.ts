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
