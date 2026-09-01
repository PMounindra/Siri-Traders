import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function init() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing');
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log('Creating inventory and inventory_logs tables if not exists...');

  await sql`
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
      available_stock INTEGER NOT NULL DEFAULT 50,
      reserved_stock INTEGER NOT NULL DEFAULT 0,
      damaged_stock INTEGER NOT NULL DEFAULT 0,
      returned_stock INTEGER NOT NULL DEFAULT 0,
      expired_stock INTEGER NOT NULL DEFAULT 0,
      incoming_stock INTEGER NOT NULL DEFAULT 0,
      reorder_level INTEGER NOT NULL DEFAULT 10,
      cost_price INTEGER NOT NULL DEFAULT 0,
      expiry_date TEXT,
      batch_number TEXT,
      location TEXT DEFAULT 'Main Shelf',
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      change_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      stock_before INTEGER NOT NULL,
      stock_after INTEGER NOT NULL,
      reason TEXT NOT NULL,
      notes TEXT,
      batch_number TEXT,
      admin_name TEXT DEFAULT 'Admin',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  console.log('Tables created or already exist.');

  // Check existing inventory count vs products
  const products = await sql`SELECT id, name, price FROM products`;
  console.log(`Found ${products.length} products in DB.`);

  let insertedCount = 0;
  for (const p of products) {
    const existing = await sql`SELECT id FROM inventory WHERE product_id = ${p.id}`;
    if (existing.length === 0) {
      // Calculate realistic default cost price (approx 75% of selling price)
      const cost = Math.max(10, Math.round((p.price || 50) * 0.75));
      // Give realistic stock between 25 and 65
      const stock = 20 + ((p.id * 7) % 45);
      const reorder = 10;
      // Realistic future expiry dates: 4 to 12 months from now
      const expiryMonth = 4 + (p.id % 8);
      const expDate = new Date();
      expDate.setMonth(expDate.getMonth() + expiryMonth);
      const expiryStr = expDate.toISOString().split('T')[0];
      const batchNo = `BAT-2026-${String(p.id).padStart(3, '0')}`;

      await sql`
        INSERT INTO inventory (
          product_id,
          available_stock,
          reserved_stock,
          damaged_stock,
          returned_stock,
          expired_stock,
          incoming_stock,
          reorder_level,
          cost_price,
          expiry_date,
          batch_number,
          location
        ) VALUES (
          ${p.id},
          ${stock},
          0,
          0,
          0,
          0,
          0,
          ${reorder},
          ${cost},
          ${expiryStr},
          ${batchNo},
          'Main Shelf'
        );
      `;
      insertedCount++;
    }
  }

  console.log(`Seeded initial inventory records for ${insertedCount} products.`);
  console.log('Done.');
}

init().catch(err => {
  console.error('Init failed:', err);
  process.exit(1);
});
