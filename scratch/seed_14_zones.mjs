import postgres from 'postgres';

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres.heskqectwuezbkfdlyez:Siritraders%401234@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';

const sql = postgres(dbUrl, { ssl: 'require', connect_timeout: 15 });

const zones = [
  { id: 'zone-1', area: 'Isnapur', pincode: '502307', time: '15-30 mins', distance: '0-3 km', active: true, deliveryFee: 0, freeDeliveryThreshold: 299, handlingCharge: 5, minOrderValue: 100 },
  { id: 'zone-2', area: 'Chitkul', pincode: '502307', time: '15-30 mins', distance: '0-3 km', active: true, deliveryFee: 0, freeDeliveryThreshold: 299, handlingCharge: 5, minOrderValue: 100 },
  { id: 'zone-3', area: 'Muttangi', pincode: '502307', time: '20-35 mins', distance: '2-5 km', active: true, deliveryFee: 0, freeDeliveryThreshold: 399, handlingCharge: 5, minOrderValue: 150 },
  { id: 'zone-4', area: 'Rudraram', pincode: '502307', time: '25-40 mins', distance: '3-6 km', active: true, deliveryFee: 0, freeDeliveryThreshold: 399, handlingCharge: 5, minOrderValue: 150 },
  { id: 'zone-5', area: 'Indrakaran', pincode: '502307', time: '25-40 mins', distance: '4-7 km', active: true, deliveryFee: 0, freeDeliveryThreshold: 499, handlingCharge: 5, minOrderValue: 200 },
  { id: 'zone-6', area: 'Lakdaram', pincode: '502307', time: '30-45 mins', distance: '5-8 km', active: true, deliveryFee: 25, freeDeliveryThreshold: 499, handlingCharge: 5, minOrderValue: 200 },
  { id: 'zone-7', area: 'Bachuguda', pincode: '502307', time: '20-35 mins', distance: '2-4 km', active: true, deliveryFee: 0, freeDeliveryThreshold: 399, handlingCharge: 5, minOrderValue: 150 },
  { id: 'zone-8', area: 'Indresham', pincode: '502334', time: '25-40 mins', distance: '3-6 km', active: true, deliveryFee: 0, freeDeliveryThreshold: 399, handlingCharge: 5, minOrderValue: 150 },
  { id: 'zone-9', area: 'Pocharam', pincode: '502307', time: '30-45 mins', distance: '5-8 km', active: true, deliveryFee: 25, freeDeliveryThreshold: 499, handlingCharge: 5, minOrderValue: 200 },
  { id: 'zone-10', area: 'Patancheru', pincode: '502319', time: '30-45 mins', distance: '6-9 km', active: true, deliveryFee: 25, freeDeliveryThreshold: 499, handlingCharge: 5, minOrderValue: 200 },
  { id: 'zone-11', area: 'Beeramguda', pincode: '502032', time: '35-50 mins', distance: '8-12 km', active: true, deliveryFee: 30, freeDeliveryThreshold: 599, handlingCharge: 5, minOrderValue: 250 },
  { id: 'zone-12', area: 'Ameenpur', pincode: '502032', time: '35-50 mins', distance: '9-13 km', active: true, deliveryFee: 30, freeDeliveryThreshold: 599, handlingCharge: 5, minOrderValue: 250 },
  { id: 'zone-13', area: 'Ramachandrapuram (RC Puram)', pincode: '502032', time: '40-55 mins', distance: '10-14 km', active: true, deliveryFee: 35, freeDeliveryThreshold: 699, handlingCharge: 5, minOrderValue: 300 },
  { id: 'zone-14', area: 'Kandi / Sangareddy', pincode: '502285', time: '45-60 mins', distance: '12-16 km', active: true, deliveryFee: 40, freeDeliveryThreshold: 799, handlingCharge: 5, minOrderValue: 350 },
];

async function run() {
  try {
    console.log('Ensuring delivery_zones table exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS delivery_zones (
        id TEXT PRIMARY KEY,
        area TEXT NOT NULL,
        pincode TEXT NOT NULL,
        time TEXT NOT NULL,
        distance TEXT,
        active BOOLEAN DEFAULT true,
        delivery_fee INTEGER DEFAULT 0 NOT NULL,
        free_delivery_threshold INTEGER DEFAULT 0 NOT NULL,
        handling_charge INTEGER DEFAULT 0 NOT NULL,
        min_order_value INTEGER DEFAULT 0,
        delivery_slots JSONB DEFAULT '[]'::jsonb,
        driver_assigned TEXT
      );
    `;

    console.log('Inserting 14 delivery zones...');
    for (const z of zones) {
      await sql`
        INSERT INTO delivery_zones (
          id, area, pincode, time, distance, active, delivery_fee, free_delivery_threshold, handling_charge, min_order_value
        ) VALUES (
          ${z.id}, ${z.area}, ${z.pincode}, ${z.time}, ${z.distance}, ${z.active}, ${z.deliveryFee}, ${z.freeDeliveryThreshold}, ${z.handlingCharge}, ${z.minOrderValue}
        ) ON CONFLICT (id) DO UPDATE SET
          area = EXCLUDED.area,
          pincode = EXCLUDED.pincode,
          time = EXCLUDED.time,
          distance = EXCLUDED.distance,
          active = EXCLUDED.active,
          delivery_fee = EXCLUDED.delivery_fee,
          free_delivery_threshold = EXCLUDED.free_delivery_threshold,
          handling_charge = EXCLUDED.handling_charge,
          min_order_value = EXCLUDED.min_order_value;
      `;
    }

    const rows = await sql`SELECT count(*) FROM delivery_zones`;
    console.log('Total zones in DB now:', rows[0].count);
  } catch (err) {
    console.error('Error seeding zones:', err);
  } finally {
    await sql.end();
  }
}

run();
