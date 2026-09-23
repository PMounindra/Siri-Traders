import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function runMigration() {
  console.log('--- Adding home_sections column to settings table ---');
  await sql`
    ALTER TABLE settings
    ADD COLUMN IF NOT EXISTS home_sections JSONB DEFAULT '{"todaysDeals":true,"bestsellers":true,"dailyOffers":true,"festiveOffers":true,"shopByCategory":true,"categories":{}}'::jsonb;
  `;
  console.log('✅ Successfully added home_sections column!');
  await sql.end();
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
