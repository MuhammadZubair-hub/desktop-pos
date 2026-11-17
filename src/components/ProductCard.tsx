import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Product } from '../types/pos';
import { usePOS } from '../context/POSContext';
import { useCart } from '../context/CartContext';
import { getProductImage } from '../utils/productImages';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { settings } = usePOS();
  const { items, updateQty } = useCart();
  const currency = settings.currency_symbol || 'Rs. ';

  const cartItem = items.find((i) => i.product.id === product.id);
  const cartQty = cartItem ? cartItem.qty : 0;
  const isOutOfStock = product.stock_qty <= 0;

  const imageUrl = getProductImage(product.name, product.category_name);
  const [imgError, setImgError] = useState(false);

  // Generate an authentic subtitle/description if not present
  const getSubDesc = () => {
    const name = product.name.toLowerCase();
    if (name.includes('pizza')) return 'Fresh hand-tossed dough, mozzarella cheese, special herbs & pizza sauce';
    if (name.includes('zinger')) return 'Crispy fried fillet, iceberg lettuce, signature mayo & sesame bun';
    if (name.includes('patty') || name.includes('burger')) return 'Juicy seasoned grilled patty, fresh veggies & special house dressing';
    if (name.includes('roll') || name.includes('wrap')) return 'Grilled tender chicken cubes wrapped in soft paratha with zesty chutney';
    if (name.includes('pasta')) return 'Creamy pasta baked with golden cheese, mushrooms & chicken chunks';
    if (name.includes('fries')) return 'Crispy potato fries seasoned with chef special spices';
    if (name.includes('deal')) return 'Value meal combo pack served fresh for quick sharing';
    return 'Delicious chef-prepared fast food specialty';
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group select-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg ${
        isOutOfStock
          ? 'border-slate-200 opacity-60'
          : 'border-slate-200/90 hover:border-yellow-400 hover:-translate-y-0.5'
      }`}
    >
      {/* Top Food Photography Banner (Zillo Behance Style) */}
      <div className="h-32 relative overflow-hidden bg-slate-900">
        {!imgError ? (
          <img
            src={imageUrl}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-500/20 via-yellow-500/15 to-orange-500/20 flex items-center justify-center text-4xl">
            🍕
          </div>
        )}

        {/* Subtle gradient overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20" />

        {/* Floating Category Tag */}
        <div className="absolute top-2.5 left-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-lg shadow-sm border border-white/60">
            {product.category_name || 'Fast Food'}
          </span>
        </div>

        {/* Stock Status Badge */}
        <div className="absolute top-2.5 right-2.5">
          {isOutOfStock ? (
            <span className="text-[10px] font-black text-rose-600 bg-white/95 px-2 py-0.5 rounded-lg shadow-sm">
              Out of stock
            </span>
          ) : product.stock_qty <= 10 ? (
            <span className="text-[10px] font-black text-amber-700 bg-white/95 px-2 py-0.5 rounded-lg shadow-sm">
              {product.stock_qty} left
            </span>
          ) : (
            <span className="text-[10px] font-mono font-bold text-white bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-lg">
              Stock: {product.stock_qty}
            </span>
          )}
        </div>
      </div>

      {/* Middle Content: Title & Description */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-amber-600 transition-colors line-clamp-1">
            {product.name}
          </h4>
          <p className="text-[11px] text-slate-600 leading-tight mt-1 line-clamp-2">
            {getSubDesc()}
          </p>
        </div>

        {/* Bottom Row: Price & Add / Quantity Selector */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
          <div>
            <span className="text-base font-black text-slate-950 font-mono">
              {currency}{product.price.toFixed(0)}
            </span>
          </div>

          {/* If already in cart, show [- qty +] pill as in Behance; else show + Add */}
          {cartQty > 0 ? (
            <div className="flex items-center space-x-1.5 bg-slate-950 text-white rounded-xl px-1.5 py-1 shadow-sm">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateQty(product.id, cartQty - 1);
                }}
                className="w-5 h-5 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Minus className="w-3 h-3 stroke-[3]" />
              </button>
              <span className="w-5 text-center font-mono font-bold text-xs text-yellow-400">
                {cartQty}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateQty(product.id, cartQty + 1);
                }}
                disabled={cartQty >= product.stock_qty}
                className="w-5 h-5 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => !isOutOfStock && onSelect(product)}
              disabled={isOutOfStock}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-sm active:scale-95'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
