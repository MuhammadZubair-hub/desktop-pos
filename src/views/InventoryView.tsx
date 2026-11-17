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
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC] p-6 space-y-5 select-none">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/20 text-slate-950 flex items-center justify-center font-bold">
            <Package className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Catalog Items</span>
            <div className="text-xl font-black font-mono text-slate-950">{products.length} Products</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Low Stock Warning</span>
            <div className="text-xl font-black font-mono text-amber-600">{lowStockCount} Products</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Out of Stock</span>
            <div className="text-xl font-black font-mono text-rose-600">{outOfStockCount} Products</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/20 text-slate-950 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Inventory Value</span>
            <div className="text-xl font-black font-mono text-slate-950">
              {currency}{totalValuation.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Add Product */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-3 flex-1">
          {/* Search */}
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, SKU, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-yellow-400 focus:bg-white"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter || ''}
            onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : null)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-yellow-400 font-semibold"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Stock Filter Pills */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1 text-xs rounded-lg font-black transition-all ${
                stockFilter === 'all' ? 'bg-yellow-400 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-3 py-1 text-xs rounded-lg font-black transition-all ${
                stockFilter === 'low' ? 'bg-yellow-400 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-3 py-1 text-xs rounded-lg font-black transition-all ${
                stockFilter === 'out' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {/* Add Product Button */}
        <button
          onClick={openCreateModal}
          className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-md shadow-yellow-400/20 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Food Item</span>
        </button>
      </div>

      {/* Product Table */}
      <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">SKU / Barcode</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Retail Price</th>
                <th className="px-4 py-3 text-right">Cost Price</th>
                <th className="px-4 py-3 text-center">In Stock</th>
                <th className="px-4 py-3 text-center">Quick Stock Adjustment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No products match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOut = p.stock_qty <= 0;
                  const isLow = p.stock_qty > 0 && p.stock_qty <= 10;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-extrabold text-slate-900">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        <div>{p.sku || '-'}</div>
                        {p.barcode && <div className="text-[10px] text-slate-400">BC: {p.barcode}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-yellow-400/15 border border-yellow-400/30 text-slate-900 font-bold text-[11px]">
                          {p.category_name || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-950">
                        {currency}{p.price.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {currency}{p.cost_price.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-black ${
                            isOut
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {p.stock_qty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                          <button
                            onClick={() => adjustProductStock(p.id, -1)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900"
                            title="Decrease by 1"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => adjustProductStock(p.id, 1)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900"
                            title="Increase by 1"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => adjustProductStock(p.id, 5)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-900 font-black hover:bg-yellow-400 text-[10px] font-mono transition-colors"
                            title="Add 5 units"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditModal(p)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg inline-flex items-center space-x-1.5 transition-colors border border-slate-200 font-bold"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-700" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="font-black text-slate-900 text-base">
                {editingProduct ? 'Edit Menu Food Item' : 'Add New Food Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product / Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-yellow-400 focus:bg-white"
                  placeholder="e.g. Chicken Tikka Pizza - Large"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:border-yellow-400 focus:bg-white"
                    placeholder="PIZ-TIK-L"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:border-yellow-400 focus:bg-white"
                    placeholder="8901003"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:border-yellow-400 focus:bg-white"
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cost ({currency})
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:border-yellow-400 focus:bg-white"
                    placeholder="700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={formData.stock_qty}
                    onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:border-yellow-400 focus:bg-white"
                    placeholder="25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-yellow-400 font-semibold"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-black shadow-md shadow-yellow-400/20"
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
