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
  CategorySalesItem,
  TopProductItem,
  TimeTrendItem,
  SalesReportFilter,
  SalesReportData,
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
  // Store settings for OCTOPIZZA'S Fast Food (Pakistani Rupee Rs.)
  const defaultSettings = [
    { key: 'pairing_pin', value: '1234' },
    { key: 'store_name', value: "OCTOPIZZA'S Fast Food" },
    { key: 'store_address', value: 'Dhobi Ghat Stop Sunny Biscuit Factory Road Near Cheema Plaza, Lahore' },
    { key: 'store_phone', value: '0335-6305006 / 0329-9447488' },
    { key: 'tax_rate', value: '0' },
    { key: 'currency_symbol', value: 'Rs. ' },
  ];

  const insertOrReplaceSetting = db.prepare(`
    INSERT INTO settings (key, value) VALUES (@key, @value)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  for (const s of defaultSettings) {
    insertOrReplaceSetting.run(s);
  }
  console.log("[Database] OCTOPIZZA'S settings configured (Currency: Rs. PKR).");

  // Check if Octopizza menu is already seeded
  const octoCheck = db.prepare("SELECT COUNT(*) as count FROM products WHERE sku LIKE 'PIZ-%' OR sku LIKE 'BRG-%'").get() as { count: number };
  if (octoCheck.count > 0) {
    console.log("[Database] Octopizza menu items already present.");
    seedSampleSalesHistoryIfEmpty();
    return;
  }

  // Clear previous non-restaurant dummy products if any
  db.prepare("DELETE FROM order_items").run();
  db.prepare("DELETE FROM orders").run();
  db.prepare("DELETE FROM products").run();
  db.prepare("DELETE FROM categories").run();

  console.log("[Database] Seeding full OCTOPIZZA'S Fast Food restaurant menu...");

  const restaurantCategories = [
    'Standard Pizzas',
    'Premium Pizzas',
    'Special Pizza Offers',
    'Zinger Burgers',
    'Patty Burgers',
    'Grill Burgers',
    'Wraps & Rolls',
    'Sandwiches',
    'Pastas',
    'Paratha Rolls',
    'Special Fries',
    'Fried Chicken',
    'Value Deals',
    'Dips & Drinks',
  ];

  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  restaurantCategories.forEach((cat) => insertCategory.run(cat));

  const getCatId = (name: string): number => {
    const row = db.prepare('SELECT id FROM categories WHERE name = ?').get(name) as { id: number };
    return row ? row.id : 1;
  };

  const menuProducts = [
    // 1. STANDARD FLAVOURS (Pizzas) - S:500, M:850, L:1200, F:1650
    { name: 'Chicken Fajita Pizza (Small 7")', sku: 'PIZ-STD-001', barcode: '8901001', price: 500, cost_price: 300, stock_qty: 50, category_id: getCatId('Standard Pizzas') },
    { name: 'Chicken Fajita Pizza (Medium 10")', sku: 'PIZ-STD-002', barcode: '8901002', price: 850, cost_price: 500, stock_qty: 50, category_id: getCatId('Standard Pizzas') },
    { name: 'Chicken Fajita Pizza (Large 13")', sku: 'PIZ-STD-003', barcode: '8901003', price: 1200, cost_price: 700, stock_qty: 40, category_id: getCatId('Standard Pizzas') },
    { name: 'Chicken Fajita Pizza (Family 16")', sku: 'PIZ-STD-004', barcode: '8901004', price: 1650, cost_price: 950, stock_qty: 30, category_id: getCatId('Standard Pizzas') },

    { name: 'Chicken Tikka Pizza (Small 7")', sku: 'PIZ-STD-005', barcode: '8901005', price: 500, cost_price: 300, stock_qty: 50, category_id: getCatId('Standard Pizzas') },
    { name: 'Chicken Tikka Pizza (Medium 10")', sku: 'PIZ-STD-006', barcode: '8901006', price: 850, cost_price: 500, stock_qty: 50, category_id: getCatId('Standard Pizzas') },
    { name: 'Chicken Tikka Pizza (Large 13")', sku: 'PIZ-STD-007', barcode: '8901007', price: 1200, cost_price: 700, stock_qty: 40, category_id: getCatId('Standard Pizzas') },
    { name: 'Chicken Tikka Pizza (Family 16")', sku: 'PIZ-STD-008', barcode: '8901008', price: 1650, cost_price: 950, stock_qty: 30, category_id: getCatId('Standard Pizzas') },

    { name: 'Spicy Boti Pizza (Medium 10")', sku: 'PIZ-STD-009', barcode: '8901009', price: 850, cost_price: 500, stock_qty: 40, category_id: getCatId('Standard Pizzas') },
    { name: 'Spicy Boti Pizza (Large 13")', sku: 'PIZ-STD-010', barcode: '8901010', price: 1200, cost_price: 700, stock_qty: 35, category_id: getCatId('Standard Pizzas') },

    { name: 'Special Arabian Pizza (Medium 10")', sku: 'PIZ-STD-011', barcode: '8901011', price: 850, cost_price: 500, stock_qty: 40, category_id: getCatId('Standard Pizzas') },
    { name: 'Special Arabian Pizza (Large 13")', sku: 'PIZ-STD-012', barcode: '8901012', price: 1200, cost_price: 700, stock_qty: 35, category_id: getCatId('Standard Pizzas') },

    { name: 'Peri Peri Pizza (Medium 10")', sku: 'PIZ-STD-013', barcode: '8901013', price: 850, cost_price: 500, stock_qty: 40, category_id: getCatId('Standard Pizzas') },
    { name: 'Seekh Kabab Pizza (Large 13")', sku: 'PIZ-STD-014', barcode: '8901014', price: 1200, cost_price: 700, stock_qty: 35, category_id: getCatId('Standard Pizzas') },
    { name: 'Veggie Lover Pizza (Medium 10")', sku: 'PIZ-STD-015', barcode: '8901015', price: 850, cost_price: 450, stock_qty: 35, category_id: getCatId('Standard Pizzas') },
    { name: 'Cheese Pizza (Small 7")', sku: 'PIZ-STD-016', barcode: '8901016', price: 500, cost_price: 280, stock_qty: 40, category_id: getCatId('Standard Pizzas') },
    { name: 'Cheese Pizza (Medium 10")', sku: 'PIZ-STD-017', barcode: '8901017', price: 850, cost_price: 480, stock_qty: 40, category_id: getCatId('Standard Pizzas') },

    // 2. PREMIUM FLAVOURS (Pizzas) - S:550, M:950, L:1350, F:1850
    { name: 'Lasania Pizza (Small 7")', sku: 'PIZ-PRM-001', barcode: '8902001', price: 550, cost_price: 330, stock_qty: 40, category_id: getCatId('Premium Pizzas') },
    { name: 'Lasania Pizza (Medium 10")', sku: 'PIZ-PRM-002', barcode: '8902002', price: 950, cost_price: 550, stock_qty: 40, category_id: getCatId('Premium Pizzas') },
    { name: 'Lasania Pizza (Large 13")', sku: 'PIZ-PRM-003', barcode: '8902003', price: 1350, cost_price: 780, stock_qty: 35, category_id: getCatId('Premium Pizzas') },
    { name: 'Lasania Pizza (Family 16")', sku: 'PIZ-PRM-004', barcode: '8902004', price: 1850, cost_price: 1100, stock_qty: 25, category_id: getCatId('Premium Pizzas') },

    { name: 'Bihari Pizza (Medium 10")', sku: 'PIZ-PRM-005', barcode: '8902005', price: 950, cost_price: 550, stock_qty: 35, category_id: getCatId('Premium Pizzas') },
    { name: 'Bihari Pizza (Large 13")', sku: 'PIZ-PRM-006', barcode: '8902006', price: 1350, cost_price: 780, stock_qty: 30, category_id: getCatId('Premium Pizzas') },

    { name: 'Fajita Sicilian Pizza (Medium 10")', sku: 'PIZ-PRM-007', barcode: '8902007', price: 950, cost_price: 550, stock_qty: 35, category_id: getCatId('Premium Pizzas') },
    { name: 'Fajita Sicilian Pizza (Large 13")', sku: 'PIZ-PRM-008', barcode: '8902008', price: 1350, cost_price: 780, stock_qty: 30, category_id: getCatId('Premium Pizzas') },

    { name: 'Malai Boti Pizza (Medium 10")', sku: 'PIZ-PRM-009', barcode: '8902009', price: 950, cost_price: 550, stock_qty: 35, category_id: getCatId('Premium Pizzas') },
    { name: 'Malai Boti Pizza (Large 13")', sku: 'PIZ-PRM-010', barcode: '8902010', price: 1350, cost_price: 780, stock_qty: 30, category_id: getCatId('Premium Pizzas') },

    { name: 'Crown Crust Pizza (Medium 10")', sku: 'PIZ-PRM-011', barcode: '8902011', price: 950, cost_price: 580, stock_qty: 35, category_id: getCatId('Premium Pizzas') },
    { name: 'Crown Crust Pizza (Large 13")', sku: 'PIZ-PRM-012', barcode: '8902012', price: 1350, cost_price: 820, stock_qty: 30, category_id: getCatId('Premium Pizzas') },

    { name: 'Kabab Crust Pizza (Large 13")', sku: 'PIZ-PRM-013', barcode: '8902013', price: 1350, cost_price: 820, stock_qty: 30, category_id: getCatId('Premium Pizzas') },
    { name: 'Chicken Supreme Pizza (Large 13")', sku: 'PIZ-PRM-014', barcode: '8902014', price: 1350, cost_price: 800, stock_qty: 35, category_id: getCatId('Premium Pizzas') },
    { name: 'Octo Special Pizza (Large 13")', sku: 'PIZ-PRM-015', barcode: '8902015', price: 1350, cost_price: 820, stock_qty: 35, category_id: getCatId('Premium Pizzas') },
    { name: 'Octo Special Pizza (Family 16")', sku: 'PIZ-PRM-016', barcode: '8902016', price: 1850, cost_price: 1100, stock_qty: 25, category_id: getCatId('Premium Pizzas') },

    // 3. PIZZA OFFERS (Double / Family Offers)
    { name: 'Double Pizza Offer (2 Small 7")', sku: 'OFF-DBL-001', barcode: '8903001', price: 900, cost_price: 550, stock_qty: 50, category_id: getCatId('Special Pizza Offers') },
    { name: 'Double Pizza Offer (2 Medium 10")', sku: 'OFF-DBL-002', barcode: '8903002', price: 1500, cost_price: 900, stock_qty: 50, category_id: getCatId('Special Pizza Offers') },
    { name: 'Double Pizza Offer (2 Large 13")', sku: 'OFF-DBL-003', barcode: '8903003', price: 2250, cost_price: 1350, stock_qty: 40, category_id: getCatId('Special Pizza Offers') },
    { name: 'Family Pizza Offer (3 Small 7")', sku: 'OFF-FAM-001', barcode: '8903004', price: 1500, cost_price: 900, stock_qty: 40, category_id: getCatId('Special Pizza Offers') },
    { name: 'Family Pizza Offer (3 Medium 10")', sku: 'OFF-FAM-002', barcode: '8903005', price: 2400, cost_price: 1450, stock_qty: 40, category_id: getCatId('Special Pizza Offers') },
    { name: 'Family Pizza Offer (3 Large 13")', sku: 'OFF-FAM-003', barcode: '8903006', price: 3600, cost_price: 2150, stock_qty: 30, category_id: getCatId('Special Pizza Offers') },

    // 4. ZINGER BURGERS
    { name: 'Zinger Burger', sku: 'BRG-ZNG-001', barcode: '8904001', price: 330, cost_price: 200, stock_qty: 60, category_id: getCatId('Zinger Burgers') },
    { name: 'Zinger Cheese Burger', sku: 'BRG-ZNG-002', barcode: '8904002', price: 380, cost_price: 230, stock_qty: 50, category_id: getCatId('Zinger Burgers') },
    { name: 'Mighty Burger', sku: 'BRG-ZNG-003', barcode: '8904003', price: 480, cost_price: 290, stock_qty: 40, category_id: getCatId('Zinger Burgers') },
    { name: 'Pizza Zinger Burger', sku: 'BRG-ZNG-004', barcode: '8904004', price: 430, cost_price: 260, stock_qty: 45, category_id: getCatId('Zinger Burgers') },
    { name: 'Pizza Zinger Large', sku: 'BRG-ZNG-005', barcode: '8904005', price: 500, cost_price: 300, stock_qty: 35, category_id: getCatId('Zinger Burgers') },
    { name: 'Pizza Zinger Tower Burger', sku: 'BRG-ZNG-006', barcode: '8904006', price: 550, cost_price: 340, stock_qty: 30, category_id: getCatId('Zinger Burgers') },
    { name: 'Octo Fillet Burger', sku: 'BRG-ZNG-007', barcode: '8904007', price: 420, cost_price: 250, stock_qty: 40, category_id: getCatId('Zinger Burgers') },
    { name: 'Octo Special Burger', sku: 'BRG-ZNG-008', barcode: '8904008', price: 390, cost_price: 235, stock_qty: 45, category_id: getCatId('Zinger Burgers') },

    // 5. PATTY BURGERS
    { name: 'Patty Burger', sku: 'BRG-PAT-001', barcode: '8905001', price: 220, cost_price: 130, stock_qty: 60, category_id: getCatId('Patty Burgers') },
    { name: 'Double Patty Cheese Burger', sku: 'BRG-PAT-002', barcode: '8905002', price: 320, cost_price: 190, stock_qty: 50, category_id: getCatId('Patty Burgers') },
    { name: 'Chapli Burger', sku: 'BRG-PAT-003', barcode: '8905003', price: 220, cost_price: 130, stock_qty: 50, category_id: getCatId('Patty Burgers') },
    { name: 'Double Chapli Patty Cheese', sku: 'BRG-PAT-004', barcode: '8905004', price: 350, cost_price: 210, stock_qty: 40, category_id: getCatId('Patty Burgers') },
    { name: 'Fish Patty Burger', sku: 'BRG-PAT-005', barcode: '8905006', price: 330, cost_price: 200, stock_qty: 35, category_id: getCatId('Patty Burgers') },
    { name: 'Double Fish Patty Cheese', sku: 'BRG-PAT-006', barcode: '8905007', price: 480, cost_price: 290, stock_qty: 30, category_id: getCatId('Patty Burgers') },

    // 6. GRILL BURGERS
    { name: 'Grill Burger', sku: 'BRG-GRL-001', barcode: '8906001', price: 400, cost_price: 240, stock_qty: 40, category_id: getCatId('Grill Burgers') },
    { name: 'Jalapeno Grill Burger', sku: 'BRG-GRL-002', barcode: '8906002', price: 500, cost_price: 300, stock_qty: 35, category_id: getCatId('Grill Burgers') },
    { name: 'Grill Double Batta Burger', sku: 'BRG-GRL-003', barcode: '8906003', price: 550, cost_price: 330, stock_qty: 30, category_id: getCatId('Grill Burgers') },

    // 7. WRAPS & ROLLS
    { name: 'Zingarella Wrap', sku: 'WRP-001', barcode: '8907001', price: 400, cost_price: 240, stock_qty: 40, category_id: getCatId('Wraps & Rolls') },
    { name: 'Octo Special Wrap', sku: 'WRP-002', barcode: '8907002', price: 400, cost_price: 240, stock_qty: 40, category_id: getCatId('Wraps & Rolls') },
    { name: 'Grill Wrap', sku: 'WRP-003', barcode: '8907003', price: 400, cost_price: 240, stock_qty: 40, category_id: getCatId('Wraps & Rolls') },
    { name: 'Jumbo Wrap', sku: 'WRP-004', barcode: '8907004', price: 450, cost_price: 270, stock_qty: 35, category_id: getCatId('Wraps & Rolls') },
    { name: 'Twister Wrap', sku: 'WRP-005', barcode: '8907005', price: 350, cost_price: 210, stock_qty: 40, category_id: getCatId('Wraps & Rolls') },
    { name: 'Shawarma Roll', sku: 'WRP-006', barcode: '8907006', price: 250, cost_price: 150, stock_qty: 50, category_id: getCatId('Wraps & Rolls') },
    { name: 'Bihari Roll', sku: 'WRP-007', barcode: '8907007', price: 300, cost_price: 180, stock_qty: 45, category_id: getCatId('Wraps & Rolls') },

    // 8. SANDWICHES
    { name: 'Club Sandwich', sku: 'SND-001', barcode: '8908001', price: 320, cost_price: 190, stock_qty: 40, category_id: getCatId('Sandwiches') },
    { name: 'Pizza Sandwich', sku: 'SND-002', barcode: '8908002', price: 380, cost_price: 230, stock_qty: 35, category_id: getCatId('Sandwiches') },
    { name: 'Malai Boti Sandwich', sku: 'SND-003', barcode: '8908003', price: 380, cost_price: 230, stock_qty: 35, category_id: getCatId('Sandwiches') },
    { name: 'Grill Sandwich', sku: 'SND-004', barcode: '8908004', price: 380, cost_price: 230, stock_qty: 35, category_id: getCatId('Sandwiches') },
    { name: 'Chicken Fajita Sandwich', sku: 'SND-005', barcode: '8908005', price: 350, cost_price: 210, stock_qty: 40, category_id: getCatId('Sandwiches') },

    // 9. PASTAS
    { name: 'Creamy Pasta', sku: 'PST-001', barcode: '8909001', price: 500, cost_price: 300, stock_qty: 30, category_id: getCatId('Pastas') },
    { name: 'Crunchy Pasta', sku: 'PST-002', barcode: '8909002', price: 550, cost_price: 330, stock_qty: 30, category_id: getCatId('Pastas') },
    { name: 'Alfredo Pasta', sku: 'PST-003', barcode: '8909003', price: 600, cost_price: 360, stock_qty: 30, category_id: getCatId('Pastas') },

    // 10. PARATHA ROLLS
    { name: 'Boti Paratha', sku: 'PRT-001', barcode: '8910001', price: 250, cost_price: 150, stock_qty: 50, category_id: getCatId('Paratha Rolls') },
    { name: 'Malai Boti Paratha', sku: 'PRT-002', barcode: '8910002', price: 300, cost_price: 180, stock_qty: 45, category_id: getCatId('Paratha Rolls') },
    { name: 'Grill Paratha', sku: 'PRT-003', barcode: '8910003', price: 300, cost_price: 180, stock_qty: 40, category_id: getCatId('Paratha Rolls') },
    { name: 'Kabab Roll Paratha', sku: 'PRT-004', barcode: '8910004', price: 280, cost_price: 170, stock_qty: 40, category_id: getCatId('Paratha Rolls') },
    { name: 'Pizza Paratha', sku: 'PRT-005', barcode: '8910005', price: 300, cost_price: 180, stock_qty: 40, category_id: getCatId('Paratha Rolls') },
    { name: 'Zinger Paratha', sku: 'PRT-006', barcode: '8910006', price: 300, cost_price: 180, stock_qty: 45, category_id: getCatId('Paratha Rolls') },

    // 11. SPECIAL FRIES
    { name: 'Supreme Loaded Fries', sku: 'FRS-001', barcode: '8911001', price: 600, cost_price: 350, stock_qty: 50, category_id: getCatId('Special Fries') },
    { name: 'Zingarella Loaded Fries', sku: 'FRS-002', barcode: '8911002', price: 550, cost_price: 320, stock_qty: 45, category_id: getCatId('Special Fries') },
    { name: 'Pizza Fries', sku: 'FRS-003', barcode: '8911003', price: 500, cost_price: 290, stock_qty: 45, category_id: getCatId('Special Fries') },
    { name: 'Mayo Garlic Fries', sku: 'FRS-004', barcode: '8911004', price: 300, cost_price: 160, stock_qty: 50, category_id: getCatId('Special Fries') },
    { name: 'Masala Fries', sku: 'FRS-005', barcode: '8911005', price: 250, cost_price: 130, stock_qty: 50, category_id: getCatId('Special Fries') },
    { name: 'Family Fries', sku: 'FRS-006', barcode: '8911006', price: 250, cost_price: 130, stock_qty: 50, category_id: getCatId('Special Fries') },
    { name: 'Regular Fries', sku: 'FRS-007', barcode: '8911007', price: 150, cost_price: 80, stock_qty: 80, category_id: getCatId('Special Fries') },

    // 12. FRIED CHICKEN
    { name: '5 Hot Wings', sku: 'CHK-001', barcode: '8912001', price: 250, cost_price: 140, stock_qty: 50, category_id: getCatId('Fried Chicken') },
    { name: '10 Hot Wings', sku: 'CHK-002', barcode: '8912002', price: 450, cost_price: 260, stock_qty: 40, category_id: getCatId('Fried Chicken') },
    { name: '5 Pcs Nuggets', sku: 'CHK-003', barcode: '8912003', price: 250, cost_price: 140, stock_qty: 50, category_id: getCatId('Fried Chicken') },
    { name: '10 Pcs Nuggets', sku: 'CHK-004', barcode: '8912004', price: 450, cost_price: 260, stock_qty: 40, category_id: getCatId('Fried Chicken') },

    // 13. VALUE DEALS & COMBOS
    { name: 'Deal 1 (1 Large + 1 Med Pizza + 1.5L Drink)', sku: 'DL-001', barcode: '8913001', price: 2099, cost_price: 1300, stock_qty: 50, category_id: getCatId('Value Deals') },
    { name: 'Deal 2 (1 Large Pizza + 2 Patty + Fries + 1.5L)', sku: 'DL-002', barcode: '8913002', price: 1949, cost_price: 1200, stock_qty: 50, category_id: getCatId('Value Deals') },
    { name: 'Deal 3 (1 Med Pizza + 1 Zinger + Fries + 2 Drinks)', sku: 'DL-003', barcode: '8913003', price: 1299, cost_price: 800, stock_qty: 50, category_id: getCatId('Value Deals') },
    { name: 'Deal 4 (2 Zinger Burgers + Fries + 2 Drinks)', sku: 'DL-004', barcode: '8913004', price: 1299, cost_price: 750, stock_qty: 50, category_id: getCatId('Value Deals') },
    { name: 'Deal 5 (1 Small Pizza + 1 Zinger + Fries + 1 Drink)', sku: 'DL-005', barcode: '8913005', price: 999, cost_price: 600, stock_qty: 50, category_id: getCatId('Value Deals') },
    { name: 'Deal 6 (1 Club Sandwich + 2 Wings + Fries + 1 Drink)', sku: 'DL-006', barcode: '8913006', price: 749, cost_price: 450, stock_qty: 50, category_id: getCatId('Value Deals') },
    { name: 'Deal 7 (1 Zinger Paratha + Fries + 1 Drink)', sku: 'DL-007', barcode: '8913007', price: 749, cost_price: 450, stock_qty: 50, category_id: getCatId('Value Deals') },
    { name: 'Friends Deal (Small Pizza + Sandwich + Zinger + Fries + 4 Nuggets + 1.5L)', sku: 'DL-FRN', barcode: '8913008', price: 2249, cost_price: 1400, stock_qty: 40, category_id: getCatId('Value Deals') },
    { name: 'Couple Deal (Small Pizza + 4 Wings + Fries + 2 Drinks)', sku: 'DL-CPL', barcode: '8913009', price: 1249, cost_price: 750, stock_qty: 40, category_id: getCatId('Value Deals') },
    { name: '5 Zinger Deal (5 Zinger Burgers + 1.5 Ltr Drink)', sku: 'DL-ZNG-5', barcode: '8913010', price: 1750, cost_price: 1100, stock_qty: 40, category_id: getCatId('Value Deals') },
    { name: '5 Patty Deal (5 Patty Burgers + 1.5 Ltr Drink)', sku: 'DL-PAT-5', barcode: '8913011', price: 1250, cost_price: 750, stock_qty: 40, category_id: getCatId('Value Deals') },
    { name: '5 Paratha Deal (5 Boti Parathas + 1.5 Ltr Drink)', sku: 'DL-PRT-5', barcode: '8913012', price: 1350, cost_price: 850, stock_qty: 40, category_id: getCatId('Value Deals') },

    // 14. DIPS & DRINKS
    { name: 'Cocktail Sauce', sku: 'DIP-001', barcode: '8914001', price: 50, cost_price: 25, stock_qty: 100, category_id: getCatId('Dips & Drinks') },
    { name: 'Chipotle Sauce', sku: 'DIP-002', barcode: '8914002', price: 50, cost_price: 25, stock_qty: 100, category_id: getCatId('Dips & Drinks') },
    { name: 'Octo Special Sauce', sku: 'DIP-003', barcode: '8914003', price: 50, cost_price: 25, stock_qty: 100, category_id: getCatId('Dips & Drinks') },
    { name: 'Mustard Sauce', sku: 'DIP-004', barcode: '8914004', price: 50, cost_price: 25, stock_qty: 100, category_id: getCatId('Dips & Drinks') },
    { name: 'Cold Drink (345 ml)', sku: 'BEV-345', barcode: '8914005', price: 70, cost_price: 45, stock_qty: 150, category_id: getCatId('Dips & Drinks') },
    { name: 'Cold Drink (1.5 Ltr)', sku: 'BEV-15L', barcode: '8914006', price: 200, cost_price: 140, stock_qty: 80, category_id: getCatId('Dips & Drinks') },
    { name: 'Extra Cheese / Topping (Small)', sku: 'EXT-SML', barcode: '8914007', price: 80, cost_price: 40, stock_qty: 100, category_id: getCatId('Dips & Drinks') },
    { name: 'Extra Cheese / Topping (Medium)', sku: 'EXT-MED', barcode: '8914008', price: 100, cost_price: 55, stock_qty: 100, category_id: getCatId('Dips & Drinks') },
    { name: 'Extra Cheese / Topping (Large)', sku: 'EXT-LRG', barcode: '8914009', price: 150, cost_price: 80, stock_qty: 100, category_id: getCatId('Dips & Drinks') },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (name, sku, barcode, price, cost_price, stock_qty, category_id, is_active)
    VALUES (@name, @sku, @barcode, @price, @cost_price, @stock_qty, @category_id, 1)
  `);

  const seedAll = db.transaction((products: typeof menuProducts) => {
    for (const p of products) {
      insertProduct.run(p);
    }
  });

  seedAll(menuProducts);
  console.log(`[Database] Successfully seeded ${menuProducts.length} OCTOPIZZA'S products across ${restaurantCategories.length} categories.`);
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

export function getSalesReport(filter: SalesReportFilter): SalesReportData {
  let dateCondition = "date(o.created_at, 'localtime') = date('now', 'localtime')";
  let displayRange = 'Today';
  let startDate = new Date().toISOString().split('T')[0];
  let endDate = startDate;
  const params: any[] = [];

  const period = filter.period || 'daily';

  if (period === 'daily') {
    const targetDate = filter.date || startDate;
    dateCondition = "date(o.created_at, 'localtime') = date(?)";
    params.push(targetDate);
    displayRange = `Daily: ${targetDate}`;
    startDate = targetDate;
    endDate = targetDate;
  } else if (period === 'weekly') {
    dateCondition = "date(o.created_at, 'localtime') >= date('now', 'localtime', '-6 days')";
    displayRange = 'Last 7 Days';
    const d = new Date();
    d.setDate(d.getDate() - 6);
    startDate = d.toISOString().split('T')[0];
    endDate = new Date().toISOString().split('T')[0];
  } else if (period === 'monthly') {
    const targetMonth = filter.month || startDate.substring(0, 7);
    dateCondition = "strftime('%Y-%m', o.created_at, 'localtime') = ?";
    params.push(targetMonth);
    displayRange = `Monthly: ${targetMonth}`;
    startDate = `${targetMonth}-01`;
    endDate = `${targetMonth}-31`;
  } else if (period === 'custom') {
    startDate = filter.startDate || startDate;
    endDate = filter.endDate || endDate;
    dateCondition = "date(o.created_at, 'localtime') BETWEEN date(?) AND date(?)";
    params.push(startDate, endDate);
    displayRange = `${startDate} to ${endDate}`;
  }

  // 1. Overall Summary
  const summaryRow = db.prepare(`
    SELECT
      COALESCE(SUM(o.total), 0) as totalRevenue,
      COALESCE(SUM(o.subtotal), 0) as subtotal,
      COALESCE(SUM(o.discount), 0) as totalDiscount,
      COALESCE(SUM(o.tax), 0) as totalTax,
      COUNT(o.id) as orderCount,
      COALESCE(SUM(CASE WHEN o.payment_method = 'CASH' THEN o.total ELSE 0 END), 0) as cashRevenue,
      COALESCE(SUM(CASE WHEN o.payment_method = 'CARD' THEN o.total ELSE 0 END), 0) as cardRevenue,
      COALESCE(SUM(CASE WHEN o.payment_method = 'OTHER' THEN o.total ELSE 0 END), 0) as otherRevenue,
      COALESCE(SUM(CASE WHEN o.source = 'DESKTOP' THEN 1 ELSE 0 END), 0) as desktopOrders,
      COALESCE(SUM(CASE WHEN o.source = 'MOBILE' THEN 1 ELSE 0 END), 0) as mobileOrders
    FROM orders o
    WHERE o.status = 'COMPLETED' AND ${dateCondition}
  `).get(...params) as any;

  const totalRevenue = Number(summaryRow?.totalRevenue || 0);
  const orderCount = Number(summaryRow?.orderCount || 0);
  const averageOrderValue = orderCount > 0 ? Number((totalRevenue / orderCount).toFixed(0)) : 0;

  // 2. Category Sales
  const categorySales = db.prepare(`
    SELECT
      c.name as categoryName,
      COALESCE(SUM(oi.qty), 0) as itemsSold,
      COALESCE(SUM(oi.line_total), 0) as revenue
    FROM categories c
    JOIN products p ON p.category_id = c.id
    JOIN order_items oi ON oi.product_id = p.id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'COMPLETED' AND ${dateCondition}
    GROUP BY c.id, c.name
    HAVING itemsSold > 0
    ORDER BY revenue DESC
  `).all(...params) as CategorySalesItem[];

  for (const cat of categorySales) {
    cat.percentage = totalRevenue > 0 ? Math.round((cat.revenue / totalRevenue) * 100) : 0;
  }

  // 3. Top Products
  const topProducts = db.prepare(`
    SELECT
      oi.product_name as productName,
      SUM(oi.qty) as qtySold,
      SUM(oi.line_total) as revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'COMPLETED' AND ${dateCondition}
    GROUP BY oi.product_name
    ORDER BY qtySold DESC, revenue DESC
    LIMIT 10
  `).all(...params) as TopProductItem[];

  // 4. Time Trend (Hourly for daily, Daily for monthly/weekly/custom)
  let trend: TimeTrendItem[] = [];
  if (period === 'daily') {
    trend = db.prepare(`
      SELECT
        strftime('%H:00', o.created_at, 'localtime') as label,
        COUNT(o.id) as orders,
        COALESCE(SUM(o.total), 0) as revenue
      FROM orders o
      WHERE o.status = 'COMPLETED' AND ${dateCondition}
      GROUP BY label
      ORDER BY label ASC
    `).all(...params) as TimeTrendItem[];
  } else {
    trend = db.prepare(`
      SELECT
        date(o.created_at, 'localtime') as label,
        COUNT(o.id) as orders,
        COALESCE(SUM(o.total), 0) as revenue
      FROM orders o
      WHERE o.status = 'COMPLETED' AND ${dateCondition}
      GROUP BY label
      ORDER BY label ASC
    `).all(...params) as TimeTrendItem[];
  }

  // 5. Total items sold count
  const itemsCountRow = db.prepare(`
    SELECT COALESCE(SUM(oi.qty), 0) as itemsTotal
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'COMPLETED' AND ${dateCondition}
  `).get(...params) as any;
  const itemsSoldTotal = Number(itemsCountRow?.itemsTotal || 0);

  // 6. Orders list
  const orders = db.prepare(`
    SELECT o.*
    FROM orders o
    WHERE o.status = 'COMPLETED' AND ${dateCondition}
    ORDER BY o.created_at DESC
  `).all(...params) as Order[];

  const getItemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const ordersWithItems: OrderWithItems[] = orders.map((order) => ({
    ...order,
    items: getItemsStmt.all(order.id) as OrderItem[],
  }));

  return {
    filter: {
      period,
      displayRange,
      startDate,
      endDate,
    },
    summary: {
      totalRevenue: Number(totalRevenue.toFixed(0)),
      subtotal: Number((summaryRow?.subtotal || 0).toFixed(0)),
      totalDiscount: Number((summaryRow?.totalDiscount || 0).toFixed(0)),
      totalTax: Number((summaryRow?.totalTax || 0).toFixed(0)),
      orderCount,
      averageOrderValue,
      cashRevenue: Number(summaryRow?.cashRevenue || 0),
      cardRevenue: Number(summaryRow?.cardRevenue || 0),
      otherRevenue: Number(summaryRow?.otherRevenue || 0),
      desktopOrders: Number(summaryRow?.desktopOrders || 0),
      mobileOrders: Number(summaryRow?.mobileOrders || 0),
      itemsSoldTotal,
    },
    categorySales,
    topProducts,
    trend,
    orders: ordersWithItems,
  };
}

export function seedSampleSalesHistoryIfEmpty(): void {
  const existingCount = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number }).count;
  if (existingCount >= 5) {
    return;
  }

  console.log('[Database] Seeding realistic sample historical sales for daily & monthly reports...');
  const allProducts = db.prepare('SELECT * FROM products LIMIT 20').all() as Product[];
  if (allProducts.length === 0) return;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const insertOrderStmt = db.prepare(`
    INSERT INTO orders (invoice_no, subtotal, discount, tax, total, payment_method, source, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
  `);
  const insertItemStmt = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, qty, unit_price, line_total)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    // Generate 18 orders across different days of this month
    for (let i = 1; i <= 18; i++) {
      const day = Math.max(1, (now.getDate() - (i % 12)));
      const hour = 11 + (i % 11); // 11:00 to 22:00
      const minute = (i * 7) % 60;
      const orderDate = new Date(currentYear, currentMonth, day, hour, minute);
      const isoDate = orderDate.toISOString().replace('T', ' ').substring(0, 19);

      const p1 = allProducts[i % allProducts.length];
      const p2 = allProducts[(i + 3) % allProducts.length];

      const qty1 = 1 + (i % 2);
      const qty2 = i % 3 === 0 ? 2 : 1;

      const subtotal = (p1.price * qty1) + (p2.price * qty2);
      const discount = i % 4 === 0 ? 100 : 0;
      const tax = 0;
      const total = subtotal - discount;
      const paymentMethod = i % 3 === 0 ? 'CARD' : 'CASH';
      const source = i % 4 === 0 ? 'MOBILE' : 'DESKTOP';
      const invoiceNo = `INV-MOCK-${1000 + i}`;

      const orderResult = insertOrderStmt.run(
        invoiceNo,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod,
        source,
        isoDate
      );
      const orderId = Number(orderResult.lastInsertRowid);

      insertItemStmt.run(orderId, p1.id, p1.name, qty1, p1.price, p1.price * qty1);
      insertItemStmt.run(orderId, p2.id, p2.name, qty2, p2.price, p2.price * qty2);
    }
  });

  transaction();
  console.log('[Database] Sample historical orders successfully created.');
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
