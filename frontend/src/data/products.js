// Products data for Siri Traders
// Live source of truth is the database via ProductContext

export const baseProducts = [];

export const toWholesaleProduct = (product) => {
  if (!product) return product;
  const unit = product.unit || 'kg';

  return {
    ...product,
    price: product.wholesalePrice || product.price,
    mrp: product.wholesaleMrp || product.mrp,
    packSize: product.bulkPackLabel || `1 ${unit}`,
    variants: (Array.isArray(product.variants) && product.variants.length > 0)
      ? product.variants
      : [
          { label: `1 ${unit}`, price: product.wholesalePrice || product.price },
          { label: product.bulkPackLabel || `5 ${unit} bulk`, price: product.bulkPackPrice || (product.wholesalePrice ? Math.round(product.wholesalePrice * 4.8) : product.price * 5) },
          { label: product.wholesaleCaseLabel || `10 ${unit} bulk`, price: product.wholesaleCasePrice || (product.wholesalePrice ? Math.round(product.wholesalePrice * 9.5) : product.price * 10) }
        ]
  };
};
