import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function dropAll() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log("Dropping tables...");
  await sql`DROP TABLE IF EXISTS "order_items" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "orders" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "users" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "products" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "categories" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "offers" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "coupons" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "delivery_zones" CASCADE;`;
  console.log("Dropped all tables successfully.");
}

dropAll().catch(console.error);
