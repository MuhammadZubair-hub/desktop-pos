import React, { createContext, useContext, useState, useMemo } from 'react';
import { Product, CartItem } from '../types/pos';
import { usePOS } from './POSContext';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, qty: number) => void;
  clearCart: () => void;
  discount: number;
  setDiscount: (discount: number) => void;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = usePOS();
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);

  const taxRate = useMemo(() => {
    return parseFloat(settings.tax_rate || '8.5') / 100;
  }, [settings.tax_rate]);

  const addItem = (product: Product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const newQty = existing.qty + qty;
        if (newQty > product.stock_qty) {
          alert(`Cannot add more than available stock (${product.stock_qty})`);
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: newQty } : i
        );
      } else {
        if (qty > product.stock_qty) {
          alert(`Cannot add more than available stock (${product.stock_qty})`);
          return prev;
        }
        return [...prev, { product, qty, unitPrice: product.price }];
      }
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id === productId) {
          if (qty > i.product.stock_qty) {
            alert(`Stock limit reached (${i.product.stock_qty} available)`);
            return i;
          }
          return { ...i, qty };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setDiscount(0);
  };

  const subtotal = useMemo(() => {
    return Number(
      items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0).toFixed(2)
    );
  }, [items]);

  const discountAmount = useMemo(() => {
    return Number(Math.min(subtotal, Math.max(0, discount)).toFixed(2));
  }, [subtotal, discount]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxAmount = useMemo(() => {
    return Number((taxableAmount * taxRate).toFixed(2));
  }, [taxableAmount, taxRate]);

  const total = useMemo(() => {
    return Number((taxableAmount + taxAmount).toFixed(2));
  }, [taxableAmount, taxAmount]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, i) => sum + i.qty, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        discount,
        setDiscount,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
