import React from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { Product } from '../types/pos';
import { usePOS } from '../context/POSContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { settings } = usePOS();
  const currency = settings.currency_symbol || 'Rs. ';
  const isOutOfStock = product.stock_qty <= 0;
  const isLowStock = product.stock_qty > 0 && product.stock_qty <= 10;

  return (
    <button
      onClick={() => !isOutOfStock && onSelect(product)}
      disabled={isOutOfStock}
      className={`group relative text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between h-36 ${
        isOutOfStock
          ? 'bg-neutral-900/60 border-neutral-800 opacity-50 cursor-not-allowed'
          : 'bg-[#141414] hover:bg-[#1c1c1c] border-neutral-800 hover:border-yellow-400/60 hover:shadow-lg hover:shadow-yellow-400/5 active:scale-[0.98]'
      }`}
    >
      {/* Top row: Category tag & Stock Badge */}
      <div className="flex items-start justify-between w-full">
        <span className="text-[10px] font-bold tracking-wider uppercase text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-md truncate max-w-[120px]">
          {product.category_name || 'Fast Food'}
        </span>

        {isOutOfStock ? (
          <span className="flex items-center space-x-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
            <AlertCircle className="w-2.5 h-2.5" />
            <span>Out of Stock</span>
          </span>
        ) : isLowStock ? (
          <span className="flex items-center space-x-1 text-[10px] font-semibold text-yellow-300 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">
            <span>{product.stock_qty} left</span>
          </span>
        ) : (
          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
            Stock: {product.stock_qty}
          </span>
        )}
      </div>

      {/* Middle: Product Name & SKU */}
      <div className="my-1">
        <h4 className="font-bold text-white text-sm line-clamp-2 leading-tight group-hover:text-yellow-400 transition-colors">
          {product.name}
        </h4>
        {product.sku && (
          <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
            SKU: {product.sku}
          </p>
        )}
      </div>

      {/* Bottom: Price & Add Icon */}
      <div className="flex items-center justify-between pt-1.5 border-t border-neutral-800/80 w-full">
        <span className="text-base font-extrabold text-yellow-400 font-mono">
          {currency}{product.price.toFixed(0)}
        </span>

        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            isOutOfStock
              ? 'bg-neutral-800 text-neutral-600'
              : 'bg-neutral-900 border border-neutral-700 text-yellow-400 group-hover:bg-yellow-400 group-hover:text-black group-hover:border-yellow-400'
          }`}
        >
          <Plus className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
};
