import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing');
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log('Adding product enhancement columns to products table if not exists...');

  await sql`
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS sku TEXT,
    ADD COLUMN IF NOT EXISTS barcode TEXT,
    ADD COLUMN IF NOT EXISTS subcategory TEXT,
    ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS gst_rate INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS hsn_code TEXT,
    ADD COLUMN IF NOT EXISTS batch_number TEXT,
    ADD COLUMN IF NOT EXISTS mfg_date TEXT,
    ADD COLUMN IF NOT EXISTS expiry_date TEXT,
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS pack_size TEXT,
    ADD COLUMN IF NOT EXISTS wholesale_price INTEGER,
    ADD COLUMN IF NOT EXISTS bulk_pack_label TEXT,
    ADD COLUMN IF NOT EXISTS bulk_pack_price INTEGER,
    ADD COLUMN IF NOT EXISTS wholesale_case_label TEXT,
    ADD COLUMN IF NOT EXISTS wholesale_case_price INTEGER;
  `;

  console.log('Columns added or already exist.');

  // Auto-populate SKUs & barcodes for existing products if missing
  const prods = await sql`SELECT id, name, category, brand, price FROM products`;
  console.log(`Checking ${prods.length} products for SKU/Barcode/Cost backfill...`);

  let updatedCount = 0;
  for (const p of prods) {
    const skuCode = `SIRI-${(p.category || 'GEN').substring(0, 3).toUpperCase()}-${String(p.id).padStart(4, '0')}`;
    const barcodeCode = `890${String(1000000000 + p.id).substring(1)}`;
    const cost = Math.max(10, Math.round((p.price || 50) * 0.78));
    const hsn = p.category === 'rice' ? '1006' : (p.category === 'oils' ? '1512' : (p.category === 'pulses' ? '0713' : '2106'));
    const batch = `BAT-2026-${String(p.id).padStart(3, '0')}`;

    await sql`
      UPDATE products 
      SET 
        sku = COALESCE(sku, ${skuCode}),
        barcode = COALESCE(barcode, ${barcodeCode}),
        cost_price = CASE WHEN cost_price = 0 OR cost_price IS NULL THEN ${cost} ELSE cost_price END,
        hsn_code = COALESCE(hsn_code, ${hsn}),
        batch_number = COALESCE(batch_number, ${batch}),
        is_published = COALESCE(is_published, TRUE),
        is_archived = COALESCE(is_archived, FALSE)
      WHERE id = ${p.id};
    `;
    updatedCount++;
  }

  console.log(`Backfilled ${updatedCount} products with SKU, Barcode, HSN, and Cost Price.`);
  console.log('Migration complete.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
