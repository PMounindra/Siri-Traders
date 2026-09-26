import postgres from 'postgres';

const sql = postgres('postgresql://postgres.heskqectwuezbkfdlyez:Siritraders%401234@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres', {
  ssl: 'require',
  connect_timeout: 15,
  onnotice: (notice) => console.log('NOTICE:', notice),
});

try {
  const r = await sql`SELECT COUNT(*) as cnt FROM products`;
  console.log('✅ DB connected. Products count:', r[0].cnt);
  const r2 = await sql`SELECT COUNT(*) as cnt FROM users`;
  console.log('✅ Users count:', r2[0].cnt);
  const r3 = await sql`SELECT COUNT(*) as cnt FROM reviews`;
  console.log('✅ Reviews count:', r3[0].cnt);
  const r4 = await sql`SELECT COUNT(*) as cnt FROM orders`;
  console.log('✅ Orders count:', r4[0].cnt);
} catch (e) {
  console.error('❌ DB ERROR:', e.message || e);
  console.error('Code:', e.code);
  console.error('Stack:', e.stack);
} finally {
  await sql.end();
}
