import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('--- Adding users.segment_override column ---');
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS segment_override TEXT;
  `;
  console.log('✅ Migration complete!');
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
