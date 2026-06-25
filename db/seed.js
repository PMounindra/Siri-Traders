import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as dotenv from 'dotenv';
import { categories, products, offers, coupons, deliveryZones } from './index.js';

// Load Dummy Data
import { categories as dummyCategories } from '../frontend/src/data/categories.js';
import { baseProducts as dummyProducts } from '../frontend/src/data/products.js';
import { baseDailyOffers, baseFestivalOffers } from '../frontend/src/data/offers.js';

const dummyCoupons = [
  { id: '1', code: 'WELCOME50', discount: 50, limit: 100, active: true },
  { id: '2', code: 'FREEDEL', discount: 40, limit: 500, active: true },
  { id: '3', code: 'FESTIVAL100', discount: 100, limit: 50, active: true }
];

const dummyDeliveryZones = [
  { id: 'z1', area: 'Hitech City & Madhapur', pincode: '500081', time: '30 mins', distance: '0-5 km', active: true },
  { id: 'z2', area: 'Kukatpally & KPHB', pincode: '500072', time: '45 mins', distance: '5-10 km', active: true },
  { id: 'z3', area: 'Gachibowli & Kondapur', pincode: '500032', time: '45 mins', distance: '5-10 km', active: true },
  { id: 'z4', area: 'Jubilee Hills & Banjara Hills', pincode: '500033', time: '60 mins', distance: '10-15 km', active: true }
];

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function seed() {
  console.log('Seeding Categories...');
  for (const cat of dummyCategories) {
    await db.insert(categories).values({
      id: cat.id,
      name: cat.name,
      image: cat.image,
      color: cat.color,
      itemCount: cat.itemCount || 0
    }).onConflictDoNothing();
  }
  console.log(`Seeded ${dummyCategories.length} categories.`);

  console.log('Seeding Products...');
  for (const prod of dummyProducts) {
    await db.insert(products).values({
      id: prod.id,
      name: prod.name,
      brand: prod.brand || '',
      category: prod.category || '',
      description: prod.description || '',
      price: prod.price,
      mrp: prod.mrp,
      discount: prod.discount,
      weight: prod.weight,
      unit: prod.unit,
      image: prod.image,
      bestseller: prod.bestseller || false,
      inStock: prod.inStock !== false,
      wholesalePrice: prod.wholesalePrice,
      wholesaleMinQty: prod.wholesaleMinQty
    }).onConflictDoNothing();
  }
  console.log(`Seeded ${dummyProducts.length} products.`);

  console.log('Seeding Offers...');
  const allOffers = [
    ...baseDailyOffers.map(o => ({ ...o, groupType: 'daily' })),
    ...baseFestivalOffers.map(o => ({ ...o, groupType: 'festival' }))
  ];
  for (const offer of allOffers) {
    await db.insert(offers).values({
      id: offer.id,
      title: offer.title,
      subtitle: offer.subtitle || '',
      price: offer.price,
      mrp: offer.mrp,
      badge: offer.badge || '',
      image: offer.image || '',
      link: offer.link || '',
      groupType: offer.groupType,
      active: true
    }).onConflictDoNothing();
  }
  console.log(`Seeded ${allOffers.length} offers.`);

  console.log('Seeding Coupons...');
  for (const coupon of dummyCoupons) {
    await db.insert(coupons).values(coupon).onConflictDoNothing();
  }
  console.log(`Seeded ${dummyCoupons.length} coupons.`);

  console.log('Seeding Delivery Zones...');
  for (const zone of dummyDeliveryZones) {
    await db.insert(deliveryZones).values(zone).onConflictDoNothing();
  }
  console.log(`Seeded ${dummyDeliveryZones.length} delivery zones.`);

  console.log('Seed completed successfully!');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
