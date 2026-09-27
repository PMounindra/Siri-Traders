// GST is charged on top of a product's selling price, at that product's own
// gstRate (set per-product in Admin; 0 by default). Computed once as a total
// (not per line, then summed) to avoid compounding rounding across items.
export const calcGstTotal = (items = []) => {
  const taxable = items.reduce((sum, item) => {
    const rate = Number(item.gstRate) || 0;
    if (!rate) return sum;
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity || item.qty) || 1;
    return sum + price * qty * (rate / 100);
  }, 0);
  return Math.round(taxable);
};
