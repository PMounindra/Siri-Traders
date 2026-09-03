// One-time migration: pulls base64 images that are still embedded directly
// in Postgres rows (products/categories/offers) out into Vercel Blob storage,
// and rewrites each row's `image` column to the resulting URL. Safe to
// re-run — it only touches rows whose image still starts with "data:".
import { eq } from 'drizzle-orm';
import { put } from '@vercel/blob';
import { db, products, categories, offers } from './index.js';

const parseDataUri = (dataUri) => {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUri);
  if (!match) return null;
  const [, mime, base64] = match;
  return { mime, buffer: Buffer.from(base64, 'base64') };
};

const EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

const migrateTable = async (table, label) => {
  const rows = await db.select().from(table);
  const toMigrate = rows.filter(r => typeof r.image === 'string' && r.image.startsWith('data:'));
  console.log(`${label}: ${toMigrate.length} row(s) with base64 images out of ${rows.length} total`);

  let migrated = 0;
  let failed = 0;
  for (const row of toMigrate) {
    const parsed = parseDataUri(row.image);
    if (!parsed) { failed++; console.error(`  ✗ ${label} ${row.id}: unrecognized image format`); continue; }
    try {
      const filename = `${label}/${row.id}.${EXT_BY_MIME[parsed.mime] || 'jpg'}`;
      const blob = await put(filename, parsed.buffer, {
        access: 'public',
        addRandomSuffix: true,
        contentType: parsed.mime,
      });
      await db.update(table).set({ image: blob.url }).where(eq(table.id, row.id));
      migrated++;
      console.log(`  ✓ ${label} ${row.id} -> ${blob.url}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${label} ${row.id} failed:`, err.message);
    }
  }
  console.log(`${label}: migrated ${migrated}, failed ${failed}\n`);
};

const main = async () => {
  await migrateTable(products, 'products');
  await migrateTable(categories, 'categories');
  await migrateTable(offers, 'offers');
  console.log('Done.');
  process.exit(0);
};

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
