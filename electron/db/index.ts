import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import {
  Category,
  Product,
  Order,
  OrderItem,
  OrderWithItems,
  CreateOrderInput,
  SalesSummary,
  Setting,
} from './types';

let db: Database.Database;
let dbPath: string;

export function initDatabase(customPath?: string): Database.Database {
  if (db) return db;

  if (customPath) {
    dbPath = customPath;
  } else {
    // In production, app.getPath('userData') is standard; fallback to local data folder for dev
    const dataDir = app ? app.getPath('userData') : path.join(__dirname, '..', '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    dbPath = path.join(dataDir, 'pos_system.db');
  }

  console.log(`[Database] Initializing SQLite database at: ${dbPath}`);
  db = new Database(dbPath);

  // WAL mode for crash/power-cut resilience and concurrent readers
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  createTables();
  seedInitialData();

  return db;
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized! Call initDatabase() first.');
  }
  return db;
}

export function getDatabasePath(): string {
  return dbPath;
}

function createTables() {
  const schema = `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      barcode TEXT UNIQUE,
      price REAL NOT NULL,
      cost_price REAL NOT NULL DEFAULT 0,
      stock_qty INTEGER NOT NULL DEFAULT 0,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      is_active INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT UNIQUE NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('CASH', 'CARD', 'OTHER')),
      source TEXT NOT NULL CHECK(source IN ('DESKTOP', 'MOBILE')),
      status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK(status IN ('COMPLETED', 'REFUNDED', 'CANCELLED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      qty INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      line_total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  `;

  db.exec(schema);
  console.log('[Database] Tables and indexes verified/created.');
}

function seedInitialData() {
  // Check settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (settingsCount.count === 0) {
    const defaultSettings = [
      { key: 'pairing_pin', value: '1234' },
      { key: 'store_name', value: 'Metro Express Mart' },
      { key: 'store_address', value: '101 Commercial Ave, Suite 4' },
      { key: 'store_phone', value: '+1 (555) 019-2834' },
      { key: 'tax_rate', value: '8.5' },
      { key: 'currency_symbol', value: '$' },
    ];
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (@key, @value)');
    const insertMany = db.transaction((settings: typeof defaultSettings) => {
      for (const s of settings) insertSetting.run(s);
    });
    insertMany(defaultSettings);
    console.log('[Database] Default settings seeded (Default Pairing PIN: 1234).');
  }

  // Check categories & products
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (productCount.count === 0) {
    console.log('[Database] Seeding initial sample categories and 10 POS products...');

    const sampleCategories = [
      'Beverages',
      'Bakery & Bread',
      'Snacks & Chips',
      'Dairy & Eggs',
      'Pantry Essentials',
    ];

    const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    sampleCategories.forEach((cat) => insertCategory.run(cat));

    const getCatId = (name: string): number => {
      const row = db.prepare('SELECT id FROM categories WHERE name = ?').get(name) as { id: number };
      return row ? row.id : 1;
    };

    const sampleProducts = [
      {
        name: 'Cold Brew Coffee (12oz)',
        sku: 'BEV-001',
        barcode: '8901001',
        price: 3.99,
        cost_price: 1.5,
        stock_qty: 45,
        category_id: getCatId('Beverages'),
      },
      {
        name: 'Fresh Orange Juice (16oz)',
        sku: 'BEV-002',
        barcode: '8901002',
        price: 4.5,
        cost_price: 1.8,
        stock_qty: 30,
        category_id: getCatId('Beverages'),
      },
      {
        name: 'Butter Croissant',
        sku: 'BAK-001',
        barcode: '8902001',
        price: 2.75,
        cost_price: 0.9,
        stock_qty: 25,
        category_id: getCatId('Bakery & Bread'),
      },
      {
        name: 'Artisanal Sourdough Loaf',
        sku: 'BAK-002',
        barcode: '8902002',
        price: 6.0,
        cost_price: 2.2,
        stock_qty: 15,
        category_id: getCatId('Bakery & Bread'),
      },
      {
        name: 'Kettle Sea Salt Chips',
        sku: 'SNK-001',
        barcode: '8903001',
        price: 2.49,
        cost_price: 0.95,
        stock_qty: 60,
        category_id: getCatId('Snacks & Chips'),
      },
      {
        name: 'Organic Roasted Almonds (150g)',
        sku: 'SNK-002',
        barcode: '8903002',
        price: 5.99,
        cost_price: 2.8,
        stock_qty: 40,
        category_id: getCatId('Snacks & Chips'),
      },
      {
        name: 'Whole Milk 1 Gallon',
        sku: 'DRY-001',
        barcode: '8904001',
        price: 4.29,
        cost_price: 2.1,
        stock_qty: 20,
        category_id: getCatId('Dairy & Eggs'),
      },
      {
        name: 'Farm Fresh Large Eggs (1 Doz)',
        sku: 'DRY-002',
        barcode: '8904002',
        price: 4.89,
        cost_price: 2.4,
        stock_qty: 35,
        category_id: getCatId('Dairy & Eggs'),
      },
      {
        name: 'Extra Virgin Olive Oil (500ml)',
        sku: 'PAN-001',
        barcode: '8905001',
        price: 11.99,
        cost_price: 6.5,
        stock_qty: 18,
        category_id: getCatId('Pantry Essentials'),
      },
      {
        name: 'Himalayan Pink Salt Grinder',
        sku: 'PAN-002',
        barcode: '8905002',
        price: 3.49,
        cost_price: 1.2,
        stock_qty: 50,
        category_id: getCatId('Pantry Essentials'),
      },
    ];

    const insertProduct = db.prepare(`
      INSERT INTO products (name, sku, barcode, price, cost_price, stock_qty, category_id, is_active)
      VALUES (@name, @sku, @barcode, @price, @cost_price, @stock_qty, @category_id, 1)
    `);

    const seedAll = db.transaction((products: typeof sampleProducts) => {
      for (const p of products) {
        insertProduct.run(p);
      }
    });

    seedAll(sampleProducts);
    console.log('[Database] 10 sample POS products successfully seeded.');
  }
}

// =================== Queries & Operations ===================

export function getCategories(): Category[] {
  return db.prepare('SELECT * FROM categories ORDER BY name ASC').all() as Category[];
}

export function getProducts(activeOnly = true): Product[] {
  const sql = `
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${activeOnly ? 'WHERE p.is_active = 1' : ''}
    ORDER BY p.name ASC
  `;
  return db.prepare(sql).all() as Product[];
}

export function getProductById(id: number): Product | undefined {
  return db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(id) as Product | undefined;
}

export function createProduct(input: Partial<Product>): Product {
  const stmt = db.prepare(`
    INSERT INTO products (name, sku, barcode, price, cost_price, stock_qty, category_id, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    input.name,
    input.sku || null,
    input.barcode || null,
    input.price || 0,
    input.cost_price || 0,
    input.stock_qty || 0,
    input.category_id || null,
    input.is_active !== undefined ? input.is_active : 1
  );

  return getProductById(Number(result.lastInsertRowid))!;
}

export function updateProduct(id: number, input: Partial<Product>): Product {
  const current = getProductById(id);
  if (!current) throw new Error(`Product with ID ${id} not found`);

  const name = input.name !== undefined ? input.name : current.name;
  const sku = input.sku !== undefined ? input.sku : current.sku;
  const barcode = input.barcode !== undefined ? input.barcode : current.barcode;
  const price = input.price !== undefined ? input.price : current.price;
  const cost_price = input.cost_price !== undefined ? input.cost_price : current.cost_price;
  const stock_qty = input.stock_qty !== undefined ? input.stock_qty : current.stock_qty;
  const category_id = input.category_id !== undefined ? input.category_id : current.category_id;
  const is_active = input.is_active !== undefined ? input.is_active : current.is_active;

  db.prepare(`
    UPDATE products
    SET name = ?, sku = ?, barcode = ?, price = ?, cost_price = ?,
        stock_qty = ?, category_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, sku, barcode, price, cost_price, stock_qty, category_id, is_active, id);

  return getProductById(id)!;
}

export function adjustStock(id: number, delta: number): Product {
  db.prepare(`
    UPDATE products
    SET stock_qty = stock_qty + ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(delta, id);

  return getProductById(id)!;
}

export function createOrderTransaction(input: CreateOrderInput): OrderWithItems {
  if (!input.items || input.items.length === 0) {
    throw new Error('Cannot create an order with empty items');
  }

  const transaction = db.transaction(() => {
    // 1. Calculate subtotal and verify stock
    let calculatedSubtotal = 0;
    const itemsToInsert: Array<{
      productId: number;
      productName: string;
      qty: number;
      unitPrice: number;
      lineTotal: number;
    }> = [];

    for (const item of input.items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId) as Product | undefined;
      if (!product) {
        throw new Error(`Product ID ${item.productId} does not exist`);
      }

      if (product.stock_qty < item.qty) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_qty}, Requested: ${item.qty}`);
      }

      const unitPrice = item.unitPrice ?? product.price;
      const lineTotal = Number((unitPrice * item.qty).toFixed(2));
      calculatedSubtotal += lineTotal;

      itemsToInsert.push({
        productId: product.id,
        productName: item.productName || product.name,
        qty: item.qty,
        unitPrice,
        lineTotal,
      });

      // Deduct stock quantity
      db.prepare('UPDATE products SET stock_qty = stock_qty - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(item.qty, product.id);
    }

    const discount = Number((input.discount || 0).toFixed(2));
    const tax = Number((input.tax || 0).toFixed(2));
    const total = Number(Math.max(0, calculatedSubtotal - discount + tax).toFixed(2));

    // 2. Generate unique invoice number: INV-YYYYMMDD-XXXX
    const today = new Date();
    const datePrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const countRow = db.prepare("SELECT COUNT(*) as count FROM orders WHERE invoice_no LIKE ?").get(`INV-${datePrefix}-%`) as { count: number };
    const sequenceNum = String((countRow ? countRow.count : 0) + 1).padStart(4, '0');
    const invoiceNo = `INV-${datePrefix}-${sequenceNum}`;

    // 3. Insert order
    const insertOrderStmt = db.prepare(`
      INSERT INTO orders (invoice_no, subtotal, discount, tax, total, payment_method, source, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED')
    `);
    const orderResult = insertOrderStmt.run(
      invoiceNo,
      calculatedSubtotal,
      discount,
      tax,
      total,
      input.paymentMethod,
      input.source
    );
    const orderId = Number(orderResult.lastInsertRowid);

    // 4. Insert order items
    const insertItemStmt = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, qty, unit_price, line_total)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertedItems: OrderItem[] = [];
    for (const item of itemsToInsert) {
      const itemResult = insertItemStmt.run(
        orderId,
        item.productId,
        item.productName,
        item.qty,
        item.unitPrice,
        item.lineTotal
      );
      insertedItems.push({
        id: Number(itemResult.lastInsertRowid),
        order_id: orderId,
        product_id: item.productId,
        product_name: item.productName,
        qty: item.qty,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
      });
    }

    const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order;

    return {
      ...createdOrder,
      items: insertedItems,
    };
  });

  return transaction();
}

export function getOrders(limit = 100, date?: string): OrderWithItems[] {
  let sql = 'SELECT * FROM orders';
  const params: any[] = [];

  if (date) {
    sql += ' WHERE date(created_at) = date(?)';
    params.push(date);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const orders = db.prepare(sql).all(...params) as Order[];

  const getItemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  return orders.map((order) => ({
    ...order,
    items: getItemsStmt.all(order.id) as OrderItem[],
  }));
}

export function getTodaySummary(): SalesSummary {
  const summaryRow = db.prepare(`
    SELECT
      COALESCE(SUM(total), 0) as totalRevenue,
      COUNT(id) as orderCount,
      COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN total ELSE 0 END), 0) as cashRevenue,
      COALESCE(SUM(CASE WHEN payment_method = 'CARD' THEN total ELSE 0 END), 0) as cardRevenue,
      COALESCE(SUM(CASE WHEN payment_method = 'OTHER' THEN total ELSE 0 END), 0) as otherRevenue,
      COALESCE(SUM(CASE WHEN source = 'DESKTOP' THEN 1 ELSE 0 END), 0) as desktopOrders,
      COALESCE(SUM(CASE WHEN source = 'MOBILE' THEN 1 ELSE 0 END), 0) as mobileOrders
    FROM orders
    WHERE date(created_at, 'localtime') = date('now', 'localtime')
      AND status = 'COMPLETED'
  `).get() as any;

  const totalRevenue = Number(summaryRow.totalRevenue || 0);
  const orderCount = Number(summaryRow.orderCount || 0);
  const averageOrderValue = orderCount > 0 ? Number((totalRevenue / orderCount).toFixed(2)) : 0;

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    orderCount,
    cashRevenue: Number(summaryRow.cashRevenue || 0),
    cardRevenue: Number(summaryRow.cardRevenue || 0),
    otherRevenue: Number(summaryRow.otherRevenue || 0),
    desktopOrders: Number(summaryRow.desktopOrders || 0),
    mobileOrders: Number(summaryRow.mobileOrders || 0),
    averageOrderValue,
  };
}

export function getSetting(key: string, defaultValue = ''): string {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? row.value : defaultValue;
}

export function setSetting(key: string, value: string): void {
  db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as Setting[];
  const result: Record<string, string> = {};
  for (const r of rows) {
    result[r.key] = r.value;
  }
  return result;
}

export function closeDatabase(): void {
  if (db) {
    try {
      db.close();
      console.log('[Database] Database connection closed.');
    } catch (err) {
      console.error('[Database] Error closing database:', err);
    }
  }
}
