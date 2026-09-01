import { pgTable, text, integer, boolean } from 'drizzle-orm/pg-core';

export const coupons = pgTable('coupons', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  discount: integer('discount'),
  limit: integer('limit'),
  type: text('type').default('flat').notNull(), // 'flat' | 'percent' | 'freeDelivery' | 'bogo' | 'buyXgetY'
  value: integer('value').default(0).notNull(),
  minOrder: integer('min_order').default(0).notNull(),
  maxDiscount: integer('max_discount'),
  buyQuantity: integer('buy_quantity').default(1),
  getQuantity: integer('get_quantity').default(1),
  targetType: text('target_type').default('all'), // 'all' | 'category' | 'product' | 'customer'
  targetCategory: text('target_category'),
  targetProductId: integer('target_product_id'),
  targetCustomerEmail: text('target_customer_email'),
  usageLimit: integer('usage_limit'),
  perUserLimit: integer('per_user_limit').default(1),
  timesUsed: integer('times_used').default(0),
  totalDiscountGiven: integer('total_discount_given').default(0),
  startDate: text('start_date'),
  endDate: text('end_date'),
  title: text('title'),
  description: text('description'),
  customerType: text('customer_type').default('retail').notNull(), // 'retail' | 'wholesale'
  active: boolean('active').default(true)
});
