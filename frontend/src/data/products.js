// Products data for Siri Traders
// Live source of truth is the database via ProductContext

export const baseProducts = [];

export const toWholesaleProduct = (product) => {
  if (!product) return product;
  const unit = product.unit || 'kg';
  const wsPrice = Number(product.wholesalePrice) || Number(product.price) || 0;
  const baseMrp = Number(product.mrp) || wsPrice;
  const baseWeightLabel = `${product.weight || '1'} ${unit}`.trim();

  // Standard default wholesale ranges
  const defaultRanges = [
    {
      label: baseWeightLabel,
      price: wsPrice,
      mrp: baseMrp
    }
  ];

  if (product.bulkPackPrice || product.bulkPackLabel) {
    defaultRanges.push({
      label: product.bulkPackLabel || `5 ${unit} bulk`,
      price: Number(product.bulkPackPrice) || (wsPrice ? Math.round(wsPrice * 4.8) : 0),
      mrp: Math.round(baseMrp * 5)
    });
  } else {
    defaultRanges.push({
      label: `5 ${unit} bulk`,
      price: wsPrice ? Math.round(wsPrice * 4.8) : 0,
      mrp: Math.round(baseMrp * 5)
    });
  }

  if (product.wholesaleCasePrice || product.wholesaleCaseLabel) {
    defaultRanges.push({
      label: product.wholesaleCaseLabel || `10 ${unit} case`,
      price: Number(product.wholesaleCasePrice) || (wsPrice ? Math.round(wsPrice * 9.5) : 0),
      mrp: Math.round(baseMrp * 10)
    });
  } else {
    defaultRanges.push({
      label: `10 ${unit} case`,
      price: wsPrice ? Math.round(wsPrice * 9.5) : 0,
      mrp: Math.round(baseMrp * 10)
    });
  }

  const rawVariants = Array.isArray(product.variants) ? product.variants : [];
  const seen = new Set();
  const mergedVariants = [];

  // Add custom variants first (allows overriding default pack prices if matching label)
  for (const v of rawVariants) {
    if (v && v.label && String(v.label).trim()) {
      const key = String(v.label).toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        mergedVariants.push({
          label: String(v.label).trim(),
          price: Number(v.price) || 0,
          mrp: Number(v.mrp) || Number(v.price) || 0
        });
      }
    }
  }

  // Append default ranges for any labels not overridden by custom variants
  for (const def of defaultRanges) {
    const key = String(def.label).toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      mergedVariants.push(def);
    }
  }

  return {
    ...product,
    price: wsPrice || product.price,
    mrp: baseMrp || product.mrp,
    packSize: product.bulkPackLabel || baseWeightLabel,
    variants: mergedVariants
  };
};
