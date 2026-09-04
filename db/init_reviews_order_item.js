import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('--- Making reviews.product_id nullable and adding order_item_id ---');
  await sql`
    ALTER TABLE reviews
    ALTER COLUMN product_id DROP NOT NULL;
  `;
  await sql`
    ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS order_item_id INTEGER;
  `;
  console.log('✅ Migration complete!');
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
