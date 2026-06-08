import { db, products, categories } from './index.js';
import { baseProducts } from '../frontend/src/data/products.js';
import { categories as baseCategories } from '../frontend/src/data/categories.js';

async function seed() {
  console.log("Seeding categories...");
  try {
    for (const cat of baseCategories) {
      await db.insert(categories).values({
        id: cat.id,
        name: cat.name,
        image: cat.image || null,
        color: cat.color || null,
        itemCount: cat.itemCount || 0
      }).onConflictDoUpdate({
        target: categories.id,
        set: {
          name: cat.name,
          image: cat.image || null,
          color: cat.color || null,
          itemCount: cat.itemCount || 0
        }
      });
    }
    console.log("Categories seeded successfully!");
  } catch (err) {
    console.error("Error seeding categories:", err);
  }

  console.log("Seeding products...");
  try {
    for (const prod of baseProducts) {
      await db.insert(products).values({
        id: prod.id,
        name: prod.name,
        category: prod.category,
        brand: prod.brand || null,
        weight: prod.weight || null,
        unit: prod.unit || null,
        price: prod.price,
        mrp: prod.mrp || null,
        discount: prod.discount || null,
        image: prod.image || null,
        description: prod.description || null,
        inStock: prod.inStock !== undefined ? prod.inStock : true,
        deliveryTime: prod.deliveryTime || '15 mins',
        isBestseller: prod.isBestseller !== undefined ? prod.isBestseller : false,
        variants: prod.variants || null
      }).onConflictDoUpdate({
        target: products.id,
        set: {
          name: prod.name,
          category: prod.category,
          brand: prod.brand || null,
          weight: prod.weight || null,
          unit: prod.unit || null,
          price: prod.price,
          mrp: prod.mrp || null,
          discount: prod.discount || null,
          image: prod.image || null,
          description: prod.description || null,
          inStock: prod.inStock !== undefined ? prod.inStock : true,
          deliveryTime: prod.deliveryTime || '15 mins',
          isBestseller: prod.isBestseller !== undefined ? prod.isBestseller : false,
          variants: prod.variants || null
        }
      });
    }
    console.log("Products seeded successfully!");
  } catch (error) {
    console.error("Error seeding products:", error);
  }
}

seed();
