import { defineConfig } from "drizzle-kit";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' }); // fallback

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required in drizzle.config.js but is not defined.");
}

export default defineConfig({
  schema: "./db/schema/*.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
