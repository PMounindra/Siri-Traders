import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('--- Starting Orders, Delivery & Customer Enhancements DB Migration ---');

  // 1. Add new columns to orders table
  console.log('1. Enhancing orders table...');
  await sql`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(32),
    ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) DEFAULT 'Pending',
    ADD COLUMN IF NOT EXISTS payment_txn_id VARCHAR(128),
    ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(64) DEFAULT 'Cash on Delivery',
    ADD COLUMN IF NOT EXISTS refund_amount INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS refund_reason TEXT,
    ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS order_notes TEXT,
    ADD COLUMN IF NOT EXISTS delivery_slot VARCHAR(128),
    ADD COLUMN IF NOT EXISTS delivery_date VARCHAR(64),
    ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(64),
    ADD COLUMN IF NOT EXISTS delivery_partner VARCHAR(128),
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS return_status VARCHAR(32) DEFAULT 'None',
    ADD COLUMN IF NOT EXISTS return_reason TEXT;
  `;

  // Drop old status_check constraint if it exists to allow 'Cancelled' and 'Returned'
  try {
    await sql`ALTER TABLE orders DROP CONSTRAINT IF EXISTS status_check;`;
  } catch (err) {
    console.log('No status_check constraint to drop or error:', err.message);
  }

  // 2. Add new columns to delivery_zones table
  console.log('2. Enhancing delivery_zones table...');
  await sql`
    ALTER TABLE delivery_zones
    ADD COLUMN IF NOT EXISTS min_order_value INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_slots JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS driver_assigned VARCHAR(128);
  `;

  // 3. Backfill existing orders with consistent data
  console.log('3. Backfilling existing orders data...');
  const existingOrders = await sql`SELECT id, user_id, payment_method, status, created_at FROM orders;`;
  console.log(`Found ${existingOrders.length} existing orders to verify/backfill.`);

  for (const ord of existingOrders) {
    // Get user info if available
    let userName = 'Customer';
    let userPhone = '';
    let userEmail = '';
    try {
      const userRows = await sql`SELECT name, phone, email FROM users WHERE id = ${ord.user_id} LIMIT 1;`;
      if (userRows.length > 0) {
        userName = userRows[0].name || 'Customer';
        userPhone = userRows[0].phone || '';
        userEmail = userRows[0].email || '';
      }
    } catch (e) {}

    const isPaid = ord.status === 'Paid' || ord.status === 'Delivered';
    const isCod = (ord.payment_method || '').toLowerCase().includes('cod');
    const paymentStatus = isPaid ? 'Paid' : (isCod ? 'Pending' : 'Paid');
    const paymentGateway = isCod ? 'Cash on Delivery' : 'UPI / Online';
    const txnId = isCod ? `COD-SIRI-${100000 + Number(ord.id)}` : `TXN-SIRI-${200000 + Number(ord.id)}`;
    const trackingNum = `TRK-SIRI-${500000 + Number(ord.id)}`;
    const deliverySlot = 'Morning (7:00 AM - 10:00 AM)';

    await sql`
      UPDATE orders
      SET
        customer_name = COALESCE(customer_name, ${userName}),
        customer_phone = COALESCE(customer_phone, ${userPhone}),
        customer_email = COALESCE(customer_email, ${userEmail}),
        payment_status = COALESCE(payment_status, ${paymentStatus}),
        payment_gateway = COALESCE(payment_gateway, ${paymentGateway}),
        payment_txn_id = COALESCE(payment_txn_id, ${txnId}),
        tracking_number = COALESCE(tracking_number, ${trackingNum}),
        delivery_slot = COALESCE(delivery_slot, ${deliverySlot}),
        return_status = COALESCE(return_status, 'None')
      WHERE id = ${ord.id};
    `;
  }

  console.log('✅ Migration & Backfill completed successfully!');
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
