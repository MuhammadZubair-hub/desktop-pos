import React from 'react';
import { Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Product } from '../types/pos';
import { usePOS } from '../context/POSContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { settings } = usePOS();
  const currency = settings.currency_symbol || '$';
  const isOutOfStock = product.stock_qty <= 0;
  const isLowStock = product.stock_qty > 0 && product.stock_qty <= 10;

  return (
    <button
      onClick={() => !isOutOfStock && onSelect(product)}
      disabled={isOutOfStock}
      className={`group relative text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between h-36 ${
        isOutOfStock
          ? 'bg-slate-900/60 border-slate-800 opacity-60 cursor-not-allowed'
          : 'bg-slate-850 hover:bg-slate-800 border-slate-700/80 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 active:scale-[0.98]'
      }`}
    >
      {/* Top row: Category tag & Stock Badge */}
      <div className="flex items-start justify-between w-full">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md truncate max-w-[110px]">
          {product.category_name || 'General'}
        </span>

        {isOutOfStock ? (
          <span className="flex items-center space-x-1 text-[10px] font-medium text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
            <AlertCircle className="w-2.5 h-2.5" />
            <span>Out of Stock</span>
          </span>
        ) : isLowStock ? (
          <span className="flex items-center space-x-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            <span>{product.stock_qty} left</span>
          </span>
        ) : (
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            Stock: {product.stock_qty}
          </span>
        )}
      </div>

      {/* Middle: Product Name & SKU */}
      <div className="my-1">
        <h4 className="font-semibold text-slate-100 text-sm line-clamp-2 leading-tight group-hover:text-blue-300 transition-colors">
          {product.name}
        </h4>
        {product.sku && (
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">
            SKU: {product.sku}
          </p>
        )}
      </div>

      {/* Bottom: Price & Add Icon */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 w-full">
        <span className="text-base font-bold text-emerald-400 font-mono">
          {currency}{product.price.toFixed(2)}
        </span>

        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
          isOutOfStock
            ? 'bg-slate-800 text-slate-600'
            : 'bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
        }`}>
          <Plus className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
};
