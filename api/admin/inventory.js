import { db, products, inventory, inventoryLogs, orders, orderItems } from '../../db/index.js';
import { eq, desc, inArray, and } from 'drizzle-orm';
import { setCorsHeaders } from '../_cors.js';
import { isAdminRequest } from '../_adminAuth.js';
import { getSessionFromRequest } from '../_adminSession.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const adminOk = await isAdminRequest(req);
  if (!adminOk) {
    return res.status(403).json({ error: 'Forbidden: admin access required' });
  }

  const session = getSessionFromRequest(req);
  const currentAdminName = session?.name || session?.email || 'Admin';

  const action = req.query.action || 'list';

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // 1. GET Requests
    // ──────────────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      // 1A. Fetch Movement / Adjustment Logs
      if (action === 'logs') {
        const productId = req.query.productId ? parseInt(req.query.productId, 10) : null;
        const limit = Math.min(200, parseInt(req.query.limit, 10) || 100);

        let query = db.select().from(inventoryLogs).orderBy(desc(inventoryLogs.createdAt)).limit(limit);
        if (productId) {
          query = db.select().from(inventoryLogs).where(eq(inventoryLogs.productId, productId)).orderBy(desc(inventoryLogs.createdAt)).limit(limit);
        }

        const logs = await query;
        return res.status(200).json(logs);
      }

      // 1B. Fetch full inventory overview & product stock tracking
      // Fetch all products
      const allProducts = await db.select().from(products);
      const allInventory = await db.select().from(inventory);

      // Map existing inventory by productId
      const invMap = new Map();
      allInventory.forEach(inv => invMap.set(inv.productId, inv));

      // Fetch active orders to calculate dynamically reserved items
      const activeOrders = await db.select().from(orders).where(
        inArray(orders.status, ['Pending', 'Preparing', 'In Transit'])
      );

      const reservedCountMap = new Map();
      if (activeOrders.length > 0) {
        const orderIds = activeOrders.map(o => o.id);
        const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
        items.forEach(item => {
          const prev = reservedCountMap.get(item.productId) || 0;
          reservedCountMap.set(item.productId, prev + (item.quantity || 1));
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const items = [];
      let totalValuation = 0;
      let totalRetailValuation = 0;
      let totalAvailableUnits = 0;
      let totalReservedUnits = 0;
      let totalDamagedUnits = 0;
      let totalReturnedUnits = 0;
      let totalExpiredUnits = 0;
      let totalIncomingUnits = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;
      let nearExpiryCount = 0;
      let expiredCount = 0;

      for (const prod of allProducts) {
        let inv = invMap.get(prod.id);

        // Auto-create record if missing
        if (!inv) {
          const cost = Math.max(10, Math.round((prod.price || 50) * 0.75));
          const stock = prod.inStock ? 45 : 0;
          const reorder = 10;
          const expDate = new Date();
          expDate.setMonth(expDate.getMonth() + 6);
          const expiryStr = expDate.toISOString().split('T')[0];
          const batchNo = `BAT-2026-${String(prod.id).padStart(3, '0')}`;

          const [newInv] = await db.insert(inventory).values({
            productId: prod.id,
            availableStock: stock,
            reservedStock: 0,
            damagedStock: 0,
            returnedStock: 0,
            expiredStock: 0,
            incomingStock: 0,
            reorderLevel: reorder,
            costPrice: cost,
            expiryDate: expiryStr,
            batchNumber: batchNo,
            location: 'Main Shelf'
          }).returning();

          inv = newInv;
        }

        const dynamicReserved = reservedCountMap.get(prod.id) || 0;
        const available = inv.availableStock ?? 0;
        const reorderLevel = inv.reorderLevel ?? 10;
        const costPrice = inv.costPrice > 0 ? inv.costPrice : Math.round((prod.price || 0) * 0.75);

        // Alerts calculations
        const isOutOfStock = available <= 0 || !prod.inStock;
        const isLowStock = !isOutOfStock && available <= reorderLevel;

        let daysUntilExpiry = null;
        let isNearExpiry = false;
        let isExpired = false;

        if (inv.expiryDate) {
          const exp = new Date(inv.expiryDate);
          if (!isNaN(exp.getTime())) {
            const diffMs = exp.getTime() - today.getTime();
            daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry < 0) {
              isExpired = true;
            } else if (daysUntilExpiry <= 30) {
              isNearExpiry = true;
            }
          }
        }

        const stockVal = available * costPrice;
        const retailVal = available * (prod.price || 0);

        totalValuation += stockVal;
        totalRetailValuation += retailVal;
        totalAvailableUnits += available;
        totalReservedUnits += dynamicReserved;
        totalDamagedUnits += (inv.damagedStock || 0);
        totalReturnedUnits += (inv.returnedStock || 0);
        totalExpiredUnits += (inv.expiredStock || 0);
        totalIncomingUnits += (inv.incomingStock || 0);

        if (isOutOfStock) outOfStockCount++;
        else if (isLowStock) lowStockCount++;

        if (isExpired) expiredCount++;
        else if (isNearExpiry) nearExpiryCount++;

        items.push({
          productId: prod.id,
          name: prod.name,
          category: prod.category,
          brand: prod.brand,
          weight: prod.weight,
          unit: prod.unit,
          price: prod.price,
          mrp: prod.mrp,
          image: prod.image,
          inStock: prod.inStock,
          wholesalePrice: prod.wholesalePrice,
          isWholesale: Boolean(prod.wholesalePrice),
          // Inventory Fields
          inventoryId: inv.id,
          availableStock: available,
          reservedStock: dynamicReserved,
          damagedStock: inv.damagedStock || 0,
          returnedStock: inv.returnedStock || 0,
          expiredStock: inv.expiredStock || 0,
          incomingStock: inv.incomingStock || 0,
          reorderLevel,
          costPrice,
          expiryDate: inv.expiryDate || '',
          batchNumber: inv.batchNumber || '',
          location: inv.location || 'Main Shelf',
          updatedAt: inv.updatedAt,
          // Valuation & Alerts
          stockValuation: stockVal,
          retailValuation: retailVal,
          isLowStock,
          isOutOfStock,
          isNearExpiry,
          isExpired,
          daysUntilExpiry
        });
      }

      const summary = {
        totalProducts: allProducts.length,
        totalValuation,
        totalRetailValuation,
        totalAvailableUnits,
        totalReservedUnits,
        totalDamagedUnits,
        totalReturnedUnits,
        totalExpiredUnits,
        totalIncomingUnits,
        lowStockCount,
        outOfStockCount,
        nearExpiryCount,
        expiredCount
      };

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.status(200).json({ summary, items });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. POST Requests (Stock Adjustments & Movements)
    // ──────────────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        productId,
        changeType = 'ADD', // 'ADD', 'SUBTRACT', 'SET', 'DAMAGE', 'RETURN', 'EXPIRED', 'RECEIVE_INCOMING'
        quantity = 0,
        targetField = 'availableStock', // 'availableStock', 'damagedStock', 'returnedStock', 'expiredStock', 'incomingStock'
        reason = 'Manual adjustment',
        notes = '',
        batchNumber,
        expiryDate,
        costPrice,
        reorderLevel
      } = body;

      const pId = parseInt(productId, 10);
      const qty = parseInt(quantity, 10);

      if (isNaN(pId) || isNaN(qty)) {
        return res.status(400).json({ error: 'Valid productId and quantity are required' });
      }

      // Find existing product and inventory
      const [prod] = await db.select().from(products).where(eq(products.id, pId));
      if (!prod) {
        return res.status(404).json({ error: 'Product not found' });
      }

      let [inv] = await db.select().from(inventory).where(eq(inventory.productId, pId));
      if (!inv) {
        const [createdInv] = await db.insert(inventory).values({
          productId: pId,
          availableStock: prod.inStock ? 50 : 0,
          reorderLevel: 10,
          costPrice: Math.round((prod.price || 50) * 0.75)
        }).returning();
        inv = createdInv;
      }

      const stockBefore = inv.availableStock;
      let newAvailable = inv.availableStock;
      let newDamaged = inv.damagedStock;
      let newReturned = inv.returnedStock;
      let newExpired = inv.expiredStock;
      let newIncoming = inv.incomingStock;

      switch (changeType) {
        case 'ADD':
          if (targetField === 'damagedStock') newDamaged += qty;
          else if (targetField === 'returnedStock') newReturned += qty;
          else if (targetField === 'expiredStock') newExpired += qty;
          else if (targetField === 'incomingStock') newIncoming += qty;
          else newAvailable += qty;
          break;

        case 'SUBTRACT':
          if (targetField === 'damagedStock') newDamaged = Math.max(0, newDamaged - qty);
          else if (targetField === 'returnedStock') newReturned = Math.max(0, newReturned - qty);
          else if (targetField === 'expiredStock') newExpired = Math.max(0, newExpired - qty);
          else if (targetField === 'incomingStock') newIncoming = Math.max(0, newIncoming - qty);
          else newAvailable = Math.max(0, newAvailable - qty);
          break;

        case 'SET':
          if (targetField === 'damagedStock') newDamaged = Math.max(0, qty);
          else if (targetField === 'returnedStock') newReturned = Math.max(0, qty);
          else if (targetField === 'expiredStock') newExpired = Math.max(0, qty);
          else if (targetField === 'incomingStock') newIncoming = Math.max(0, qty);
          else newAvailable = Math.max(0, qty);
          break;

        case 'DAMAGE':
          // Move from available to damaged
          newAvailable = Math.max(0, newAvailable - qty);
          newDamaged += qty;
          break;

        case 'RETURN':
          // Customer return added to returned bucket & back to stock if requested
          newReturned += qty;
          newAvailable += qty;
          break;

        case 'EXPIRED':
          // Move from available to expired
          newAvailable = Math.max(0, newAvailable - qty);
          newExpired += qty;
          break;

        case 'RECEIVE_INCOMING':
          // Move from incoming to available
          newIncoming = Math.max(0, newIncoming - qty);
          newAvailable += qty;
          break;

        default:
          newAvailable = Math.max(0, newAvailable + qty);
      }

      // Update inventory table
      const updateData = {
        availableStock: newAvailable,
        damagedStock: newDamaged,
        returnedStock: newReturned,
        expiredStock: newExpired,
        incomingStock: newIncoming,
        updatedAt: new Date()
      };

      if (batchNumber !== undefined) updateData.batchNumber = batchNumber;
      if (expiryDate !== undefined) updateData.expiryDate = expiryDate;
      if (costPrice !== undefined) updateData.costPrice = parseInt(costPrice, 10) || 0;
      if (reorderLevel !== undefined) updateData.reorderLevel = parseInt(reorderLevel, 10) || 10;

      const [updatedInv] = await db
        .update(inventory)
        .set(updateData)
        .where(eq(inventory.productId, pId))
        .returning();

      // Automatically sync product.inStock with availableStock
      const shouldBeInStock = newAvailable > 0;
      if (prod.inStock !== shouldBeInStock) {
        await db.update(products).set({ inStock: shouldBeInStock }).where(eq(products.id, pId));
      }

      // Insert log entry
      const [logEntry] = await db.insert(inventoryLogs).values({
        productId: pId,
        productName: prod.name,
        changeType,
        quantity: qty,
        stockBefore,
        stockAfter: newAvailable,
        reason: reason || 'Inventory adjustment',
        notes: notes || '',
        batchNumber: batchNumber || inv.batchNumber || '',
        adminName: currentAdminName
      }).returning();

      return res.status(200).json({
        success: true,
        inventory: updatedInv,
        log: logEntry
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. PUT Requests (Reorder Level & Product Batch Configuration)
    // ──────────────────────────────────────────────────────────────────────────
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        productId,
        reorderLevel,
        costPrice,
        expiryDate,
        batchNumber,
        location,
        incomingStock
      } = body;

      const pId = parseInt(productId, 10);
      if (isNaN(pId)) {
        return res.status(400).json({ error: 'Valid productId is required' });
      }

      const [prod] = await db.select().from(products).where(eq(products.id, pId));
      if (!prod) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const updateData = { updatedAt: new Date() };
      if (reorderLevel !== undefined) updateData.reorderLevel = Math.max(0, parseInt(reorderLevel, 10) || 0);
      if (costPrice !== undefined) updateData.costPrice = Math.max(0, parseInt(costPrice, 10) || 0);
      if (expiryDate !== undefined) updateData.expiryDate = expiryDate;
      if (batchNumber !== undefined) updateData.batchNumber = batchNumber;
      if (location !== undefined) updateData.location = location;
      if (incomingStock !== undefined) updateData.incomingStock = Math.max(0, parseInt(incomingStock, 10) || 0);

      const [updatedInv] = await db
        .update(inventory)
        .set(updateData)
        .where(eq(inventory.productId, pId))
        .returning();

      // Log config change
      await db.insert(inventoryLogs).values({
        productId: pId,
        productName: prod.name,
        changeType: 'CONFIG_UPDATE',
        quantity: 0,
        stockBefore: updatedInv.availableStock,
        stockAfter: updatedInv.availableStock,
        reason: `Updated reorder settings: Reorder Lvl=${updatedInv.reorderLevel}, Exp=${updatedInv.expiryDate || 'N/A'}, Batch=${updatedInv.batchNumber || 'N/A'}`,
        notes: `Cost: ₹${updatedInv.costPrice}, Incoming: ${updatedInv.incomingStock}`,
        batchNumber: updatedInv.batchNumber || '',
        adminName: currentAdminName
      });

      return res.status(200).json({ success: true, inventory: updatedInv });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Inventory API error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again shortly.' });
  }
}
