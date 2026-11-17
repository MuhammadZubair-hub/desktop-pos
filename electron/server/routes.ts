import { Router, Request, Response } from 'express';
import {
  getCategories,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  createOrderTransaction,
  getOrders,
  getTodaySummary,
  getSalesReport,
  getAllSettings,
  setSetting,
  getSetting,
} from '../db';
import { performBackup, listBackups } from '../db/backup';
import { getLocalIpAddresses, getPrimaryLanIp } from '../services/network-info';
import { broadcastWsEvent } from './index';

export const apiRouter = Router();

// GET /api/ping -> Health check & discovery info
apiRouter.get('/ping', (req: Request, res: Response) => {
  const configuredPin = getSetting('pairing_pin', '1234');
  const providedKey = req.headers['x-api-key'] || req.headers['x-pairing-pin'] || req.query.apiKey;
  const isAuth = providedKey === configuredPin;

  res.json({
    status: 'ok',
    service: 'POS_LOCAL_SERVER',
    name: getSetting('store_name', "OCTOPIZZA'S Fast Food"),
    port: 5000,
    currency: getSetting('currency_symbol', 'Rs. '),
    primaryIp: getPrimaryLanIp(),
    localIps: getLocalIpAddresses(),
    authenticated: isAuth,
    timestamp: Date.now(),
  });
});

// GET /api/products -> Fetch all active products & categories
apiRouter.get('/products', (req: Request, res: Response) => {
  try {
    const categories = getCategories();
    const products = getProducts(true);
    res.json({
      categories,
      products,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch products', details: err.message });
  }
});

// POST /api/products -> Add new product
apiRouter.post('/products', (req: Request, res: Response) => {
  try {
    const { name, sku, barcode, price, cost_price, stock_qty, category_id } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const newProduct = createProduct({
      name,
      sku: sku || undefined,
      barcode: barcode || undefined,
      price: Number(price),
      cost_price: Number(cost_price || 0),
      stock_qty: Number(stock_qty || 0),
      category_id: category_id ? Number(category_id) : null,
      is_active: 1,
    });

    broadcastWsEvent('PRODUCT_ADDED', newProduct);
    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create product', details: err.message });
  }
});

// PUT /api/products/:id -> Update existing product
apiRouter.put('/products/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = updateProduct(id, req.body);
    broadcastWsEvent('PRODUCT_UPDATED', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update product', details: err.message });
  }
});

// POST /api/products/:id/stock -> Quick stock adjustment
apiRouter.post('/products/:id/stock', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { delta } = req.body;
    if (typeof delta !== 'number') {
      return res.status(400).json({ error: 'Delta number is required' });
    }
    const updated = adjustStock(id, delta);
    broadcastWsEvent('STOCK_UPDATED', { productId: id, stock_qty: updated.stock_qty });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to adjust stock', details: err.message });
  }
});

// GET /api/orders -> Sales history and today summary
apiRouter.get('/orders', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const date = req.query.date ? String(req.query.date) : undefined;

    const summary = getTodaySummary();
    const orders = getOrders(limit, date);

    res.json({
      summary,
      orders,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
});

// GET /api/reports/sales -> Daily, weekly, monthly and custom sales reports with analytics
apiRouter.get('/reports/sales', (req: Request, res: Response) => {
  try {
    const period = (req.query.period as any) || 'daily';
    const date = req.query.date ? String(req.query.date) : undefined;
    const month = req.query.month ? String(req.query.month) : undefined;
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

    const report = getSalesReport({
      period,
      date,
      month,
      startDate,
      endDate,
    });

    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate sales report', details: err.message });
  }
});

// POST /api/orders -> Create new order inside SQLite transaction
apiRouter.post('/orders', (req: Request, res: Response) => {
  try {
    const { items, paymentMethod, discount, tax, source } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const validPaymentMethods = ['CASH', 'CARD', 'OTHER'];
    const pMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'CASH';
    const orderSource = source === 'MOBILE' ? 'MOBILE' : 'DESKTOP';

    const createdOrder = createOrderTransaction({
      items,
      paymentMethod: pMethod,
      discount: discount ? Number(discount) : 0,
      tax: tax ? Number(tax) : 0,
      source: orderSource,
    });

    // Broadcast new order to Desktop and all connected Mobile devices
    broadcastWsEvent('NEW_ORDER', createdOrder);

    // Also broadcast refreshed stock for the items involved
    for (const item of createdOrder.items) {
      const prod = getProductById(item.product_id);
      if (prod) {
        broadcastWsEvent('STOCK_UPDATED', { productId: prod.id, stock_qty: prod.stock_qty });
      }
    }

    res.status(201).json(createdOrder);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to complete order', details: err.message });
  }
});

// GET /api/settings -> Fetch store settings
apiRouter.get('/settings', (_req: Request, res: Response) => {
  try {
    const settings = getAllSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings', details: err.message });
  }
});

// PUT /api/settings -> Update store settings
apiRouter.put('/settings', (req: Request, res: Response) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      setSetting(key, String(value));
    }
    const updated = getAllSettings();
    broadcastWsEvent('SETTINGS_UPDATED', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings', details: err.message });
  }
});

// POST /api/backup -> Manual backup trigger
apiRouter.post('/backup', async (_req: Request, res: Response) => {
  try {
    const result = await performBackup();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Backup failed', details: err.message });
  }
});

// GET /api/backups -> List existing backups
apiRouter.get('/backups', (_req: Request, res: Response) => {
  try {
    const list = listBackups();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list backups', details: err.message });
  }
});
