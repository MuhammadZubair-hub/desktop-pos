import React from 'react';
import { Plus, Minus, AlertCircle } from 'lucide-react';
import { Product } from '../types/pos';
import { usePOS } from '../context/POSContext';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

// Visual category badges with appetizing warm food icons & gradients
const getCategoryVisual = (categoryName?: string) => {
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('pizza')) {
    return {
      bg: 'from-amber-500/20 via-orange-500/15 to-yellow-500/10',
      icon: '🍕',
      label: 'Artisan Pizza',
    };
  }
  if (cat.includes('zinger') || cat.includes('burger')) {
    return {
      bg: 'from-yellow-500/25 via-amber-500/15 to-orange-500/10',
      icon: '🍔',
      label: 'Crispy Burger',
    };
  }
  if (cat.includes('wrap') || cat.includes('roll')) {
    return {
      bg: 'from-emerald-500/20 via-yellow-500/15 to-amber-500/10',
      icon: '🌯',
      label: 'Grilled Wrap',
    };
  }
  if (cat.includes('pasta')) {
    return {
      bg: 'from-orange-500/20 via-red-500/10 to-yellow-500/10',
      icon: '🍝',
      label: 'Italian Pasta',
    };
  }
  if (cat.includes('fries') || cat.includes('chicken')) {
    return {
      bg: 'from-yellow-500/20 via-amber-500/15 to-orange-500/10',
      icon: '🍟',
      label: 'Sides & Crispy',
    };
  }
  if (cat.includes('deal') || cat.includes('offer')) {
    return {
      bg: 'from-rose-500/20 via-yellow-500/20 to-amber-500/15',
      icon: '⭐',
      label: 'Special Deal',
    };
  }
  return {
    bg: 'from-slate-200 via-slate-100 to-slate-50',
    icon: '🍽️',
    label: 'Fast Food',
  };
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { settings } = usePOS();
  const { items, updateQty } = useCart();
  const currency = settings.currency_symbol || 'Rs. ';

  const cartItem = items.find((i) => i.product.id === product.id);
  const cartQty = cartItem ? cartItem.qty : 0;
  const isOutOfStock = product.stock_qty <= 0;

  const visual = getCategoryVisual(product.category_name);

  // Generate an authentic subtitle/description if not present
  const getSubDesc = () => {
    const name = product.name.toLowerCase();
    if (name.includes('pizza')) return 'Fresh hand-tossed dough, mozzarella cheese, special herbs & pizza sauce';
    if (name.includes('zinger')) return 'Crispy fried fillet, iceberg lettuce, signature mayo & sesame bun';
    if (name.includes('patty') || name.includes('burger')) return 'Juicy seasoned grilled patty, fresh veggies & special house dressing';
    if (name.includes('roll') || name.includes('wrap')) return 'Grilled tender chicken cubes wrapped in soft paratha with zesty chutney';
    if (name.includes('pasta')) return 'Creamy pasta baked with golden cheese, mushrooms & chicken chunks';
    if (name.includes('deal')) return 'Value meal combo pack served fresh for quick sharing';
    return 'Delicious chef-prepared fast food specialty';
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group select-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md ${
        isOutOfStock
          ? 'border-slate-200 opacity-60'
          : 'border-slate-200/90 hover:border-yellow-400/80 hover:-translate-y-0.5'
      }`}
    >
      {/* Top Visual Area (as shown in Behance screenshot cards) */}
      <div className={`h-24 bg-gradient-to-br ${visual.bg} relative p-3 flex items-center justify-between border-b border-slate-100`}>
        <div className="w-12 h-12 rounded-xl bg-white/90 shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
          {visual.icon}
        </div>

        <div className="flex flex-col items-end space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 bg-white/95 px-2 py-0.5 rounded-md shadow-xs border border-slate-200/60">
            {product.category_name || visual.label}
          </span>
          {isOutOfStock ? (
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              Out of stock
            </span>
          ) : product.stock_qty <= 10 ? (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              {product.stock_qty} left
            </span>
          ) : (
            <span className="text-[10px] font-mono text-slate-600 bg-white/80 px-1.5 py-0.5 rounded">
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

        {/* Bottom Row: Price & Add / Quantity Selector (Zillo Behance style) */}
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
