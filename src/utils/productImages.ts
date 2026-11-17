/**
 * Helper to map menu items & categories to authentic, high-resolution food photography
 */

export const getProductImage = (productName: string, categoryName?: string): string => {
  const name = productName.toLowerCase();
  const cat = (categoryName || '').toLowerCase();

  // 1. Specific Pizza Variations
  if (name.includes('crown') || name.includes('kabab crust') || name.includes('stuffed')) {
    return '/images/pizza-crown.jpg';
  }
  if (name.includes('pizza') || cat.includes('pizza')) {
    return '/images/pizza-artisan.jpg';
  }

  // 2. Burgers
  if (name.includes('zinger') || name.includes('mighty') || name.includes('tower') || name.includes('fillet')) {
    return '/images/zinger-burger.jpg';
  }
  if (name.includes('burger') || cat.includes('burger')) {
    return '/images/zinger-burger.jpg';
  }

  // 3. Wraps, Rolls, Shawarmas
  if (name.includes('wrap') || name.includes('roll') || name.includes('twister') || name.includes('shawarma') || cat.includes('roll') || cat.includes('wrap')) {
    return '/images/wrap-roll.jpg';
  }

  // 4. Pastas & Italian
  if (name.includes('pasta') || name.includes('macaroni') || cat.includes('pasta')) {
    return '/images/pasta-cheesy.jpg';
  }

  // 5. Fries & Loaded Sides
  if (name.includes('fries') || name.includes('potato') || cat.includes('fries')) {
    return '/images/fries-loaded.jpg';
  }

  // 6. Fried Chicken & Wings
  if (name.includes('chicken') && (name.includes('fried') || name.includes('crispy') || name.includes('piece') || name.includes('wing') || name.includes('nugget')) || cat.includes('fried chicken')) {
    return '/images/fried-chicken.jpg';
  }

  // 7. Value Deals & Combos
  if (name.includes('deal') || name.includes('combo') || name.includes('feast') || name.includes('offer') || cat.includes('deal') || cat.includes('offer')) {
    return '/images/deal-combo.jpg';
  }

  // 8. Dips & Cold Drinks
  if (name.includes('drink') || name.includes('coke') || name.includes('pepsi') || name.includes('sprite') || name.includes('7up') || name.includes('marinda') || name.includes('dew') || name.includes('fanta') || cat.includes('drink')) {
    return '/images/drinks-chilled.jpg';
  }

  // Default fallback
  if (cat.includes('sandwich')) {
    return '/images/wrap-roll.jpg';
  }

  return '/images/pizza-artisan.jpg';
};
