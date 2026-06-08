import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import dotenv from 'dotenv';

import { products } from './schema/products.js';
import { categories } from './schema/categories.js';
import { orders } from './schema/orders.js';
import { orderItems } from './schema/order_items.js';
import { users } from './schema/users.js';

dotenv.config();

const schema = {
  products,
  categories,
  orders,
  orderItems,
  users
};

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Export everything from schemas for clean single-entry imports
export { products } from './schema/products.js';
export { categories } from './schema/categories.js';
export { orders } from './schema/orders.js';
export { orderItems } from './schema/order_items.js';
export { users } from './schema/users.js';
