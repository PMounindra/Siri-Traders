import postgres from 'postgres';

const sql = postgres('postgresql://postgres.heskqectwuezbkfdlyez:Siritraders%401234@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres', {
  ssl: 'require',
  connect_timeout: 15,
});

try {
  const r = await sql`SELECT * FROM delivery_zones ORDER BY id`;
  console.log('Count:', r.length);
  console.log(JSON.stringify(r, null, 2));
} catch(e) {
  console.error('DB ERROR:', e.message);
} finally {
  await sql.end();
}
