export const extractBaseName = (name = "") => {
  return name
    .toLowerCase()
    .replace(/\b(rs\.?|\u20b9)\s*\d+\b/gi, "")
    .replace(/\b\d+\s*(rs\.?|\u20b9)\b/gi, "")
    .replace(
      /\b\d+(\.\d+)?\s*(g|gm|grams|kg|ml|l|liter|litres|sachet|pkt|packet|pcs|piece|pieces|pads|oz)\b/gi,
      ""
    )
    .replace(/\bpack of \d+\b/gi, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const extractVariantLabel = (p) => {
  if (!p) return 'Standard';
  const weightStr = (p.weight ? `${p.weight} ${p.unit || 'g'}` : '').trim();
  
  const qtyMatch = (p.name || '').match(/(\d+(?:\.\d+)?\s*(?:g|gm|grams|kg|ml|l|liter|litres|pcs|pieces|pads|oz))\b/i);
  const priceMatch = (p.name || '').match(/(?:rs\.?|\u20b9)\s*(\d+)|\b(\d+)\s*(?:rs\.?|\u20b9)/i);
  
  if (qtyMatch) {
    const qty = qtyMatch[1].trim();
    if (priceMatch) {
      const pVal = priceMatch[1] || priceMatch[2];
      return `${qty} (₹${pVal})`;
    }
    return qty;
  }
  
  if (weightStr) {
    if (priceMatch) {
      const pVal = priceMatch[1] || priceMatch[2];
      return `${weightStr} (₹${pVal})`;
    }
    return weightStr;
  }
  
  if (priceMatch) {
    const pVal = priceMatch[1] || priceMatch[2];
    return `₹${pVal} Pack`;
  }
  
  const base = extractBaseName(p.name);
  let rem = (p.name || '').toLowerCase();
  if (base) {
    rem = rem.replace(base, '').replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim();
  }
  if (rem) {
    return rem.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  
  return 'Standard';
};

export const groupProductsByBase = (productList) => {
  if (!Array.isArray(productList) || productList.length === 0) return [];

  const groups = new Map();

  for (const prod of productList) {
    if (!prod) continue;
    
    const catKey = (prod.category || '').toLowerCase().trim();
    const baseKey = extractBaseName(prod.name);
    
    const groupKey = (baseKey && baseKey.length >= 3) ? `${catKey}::${baseKey}` : `id::${prod.id}`;
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push(prod);
  }

  const result = [];

  for (const [key, items] of groups.entries()) {
    if (items.length === 1) {
      result.push(items[0]);
    } else {
      const primary = { ...items[0] };
      const combinedVariants = [];
      const seenLabels = new Set();

      for (const item of items) {
        if (Array.isArray(item.variants) && item.variants.length > 0) {
          for (const v of item.variants) {
            const lbl = String(v.label).trim();
            if (lbl && !seenLabels.has(lbl.toLowerCase())) {
              seenLabels.add(lbl.toLowerCase());
              combinedVariants.push(v);
            }
          }
        } else {
          const lbl = extractVariantLabel(item);
          if (lbl && !seenLabels.has(lbl.toLowerCase())) {
            seenLabels.add(lbl.toLowerCase());
            combinedVariants.push({
              label: lbl,
              price: Number(item.price) || 0,
              mrp: Number(item.mrp) || Number(item.price) || 0
            });
          }
        }
      }

      combinedVariants.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));

      primary.variants = combinedVariants;
      if (combinedVariants.length > 0) {
        primary.price = combinedVariants[0].price;
        primary.mrp = combinedVariants[0].mrp;
      }

      result.push(primary);
    }
  }

  return result;
};
