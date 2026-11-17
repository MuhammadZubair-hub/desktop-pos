import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, Edit2, AlertCircle, TrendingUp, X } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Product } from '../types/pos';

export const InventoryView: React.FC = () => {
  const { products, categories, saveProduct, adjustProductStock, settings } = usePOS();
  const currency = settings.currency_symbol || 'Rs. ';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    price: '',
    cost_price: '',
    stock_qty: '',
    category_id: '',
    is_active: 1,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));

      const matchesCat = categoryFilter === null || p.category_id === categoryFilter;

      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = p.stock_qty > 0 && p.stock_qty <= 10;
      if (stockFilter === 'out') matchesStock = p.stock_qty <= 0;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  // Inventory stats
  const totalValuation = useMemo(() => {
    return products.reduce((acc, p) => acc + p.price * p.stock_qty, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock_qty > 0 && p.stock_qty <= 10).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.stock_qty <= 0).length;
  }, [products]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      price: '',
      cost_price: '',
      stock_qty: '20',
      category_id: categories[0]?.id?.toString() || '',
      is_active: 1,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      barcode: product.barcode || '',
      price: product.price.toString(),
      cost_price: product.cost_price.toString(),
      stock_qty: product.stock_qty.toString(),
      category_id: product.category_id?.toString() || '',
      is_active: product.is_active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Product name is required');
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Valid retail price is required');
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);

      await saveProduct(
        {
          name: formData.name.trim(),
          sku: formData.sku.trim() || undefined,
          barcode: formData.barcode.trim() || undefined,
          price: priceNum,
          cost_price: parseFloat(formData.cost_price) || 0,
          stock_qty: parseInt(formData.stock_qty, 10) || 0,
          category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
          is_active: formData.is_active,
        },
        editingProduct?.id
      );

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0A] p-6 space-y-5">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-neutral-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 font-medium">Menu Catalog Items</span>
            <div className="text-xl font-bold font-mono text-white">{products.length} Products</div>
          </div>
        </div>

        <div className="bg-[#121212] border border-neutral-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 font-medium">Low Stock Items</span>
            <div className="text-xl font-bold font-mono text-yellow-400">{lowStockCount} Products</div>
          </div>
        </div>

        <div className="bg-[#121212] border border-neutral-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 font-medium">Out of Stock</span>
            <div className="text-xl font-bold font-mono text-rose-400">{outOfStockCount} Products</div>
          </div>
        </div>

        <div className="bg-[#121212] border border-neutral-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 font-medium">Stock Value</span>
            <div className="text-xl font-bold font-mono text-white">
              {currency}{totalValuation.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Add Product */}
      <div className="bg-[#121212] border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-3 flex-1">
          {/* Search */}
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search product, SKU, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter || ''}
            onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : null)}
            className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Stock Filter Pills */}
          <div className="flex items-center space-x-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1 text-xs rounded font-bold transition-colors ${
                stockFilter === 'all' ? 'bg-yellow-400 text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-2.5 py-1 text-xs rounded font-bold transition-colors ${
                stockFilter === 'low' ? 'bg-yellow-400 text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-2.5 py-1 text-xs rounded font-bold transition-colors ${
                stockFilter === 'out' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {/* Add Product Button */}
        <button
          onClick={openCreateModal}
          className="bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg shadow-yellow-400/20 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Product Table */}
      <div className="flex-1 bg-[#121212] border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171717] text-neutral-400 uppercase font-semibold sticky top-0 border-b border-neutral-800">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">SKU / Barcode</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Retail Price</th>
                <th className="px-4 py-3 text-right">Cost Price</th>
                <th className="px-4 py-3 text-center">In Stock</th>
                <th className="px-4 py-3 text-center">Quick Adjust</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-neutral-500">
                    No products match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOut = p.stock_qty <= 0;
                  const isLow = p.stock_qty > 0 && p.stock_qty <= 10;
                  return (
                    <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-white">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-neutral-400">
                        <div>{p.sku || '-'}</div>
                        {p.barcode && <div className="text-[10px] text-neutral-500">BC: {p.barcode}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-yellow-400 font-semibold text-[11px]">
                          {p.category_name || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-extrabold text-yellow-400">
                        {currency}{p.price.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-neutral-400">
                        {currency}{p.cost_price.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-bold ${
                            isOut
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : isLow
                              ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30'
                              : 'bg-neutral-800 text-white border border-neutral-700'
                          }`}
                        >
                          {p.stock_qty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center space-x-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                          <button
                            onClick={() => adjustProductStock(p.id, -1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-white"
                            title="Decrease by 1"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => adjustProductStock(p.id, 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-white"
                            title="Increase by 1"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => adjustProductStock(p.id, 5)}
                            className="w-6 h-6 rounded flex items-center justify-center text-yellow-400 hover:bg-neutral-800 hover:text-yellow-300 text-[10px] font-mono font-bold"
                            title="Add 5 units"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditModal(p)}
                          className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg inline-flex items-center space-x-1.5 transition-colors border border-neutral-800"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-yellow-400" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121212] border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-[#171717]">
              <h3 className="font-black text-white text-base">
                {editingProduct ? 'Edit Menu Product' : 'Add New Menu Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                  placeholder="e.g. Chicken Tikka Pizza - Large"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-yellow-400"
                    placeholder="PIZ-TIK-L"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-yellow-400"
                    placeholder="8901003"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-yellow-400"
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Cost ({currency})
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-yellow-400"
                    placeholder="700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={formData.stock_qty}
                    onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-yellow-400"
                    placeholder="25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300">
                  {formError}
                </div>
              )}

              <div className="pt-3 border-t border-neutral-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black shadow-md shadow-yellow-400/20"
                >
                  {isSaving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
