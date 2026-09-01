import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  total: integer('total').notNull(),
  status: text('status').default('Pending'), // 'Pending', 'Preparing', 'In Transit', 'Delivered', 'Paid', 'Cancelled'
  deliveryAddress: text('delivery_address'),
  paymentMethod: text('payment_method'),
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  customerEmail: text('customer_email'),
  paymentStatus: text('payment_status').default('Pending'), // 'Pending', 'Paid', 'Failed', 'Refunded', 'Partially Refunded'
  paymentTxnId: text('payment_txn_id'),
  paymentGateway: text('payment_gateway').default('Cash on Delivery'),
  refundAmount: integer('refund_amount').default(0),
  refundReason: text('refund_reason'),
  refundedAt: timestamp('refunded_at'),
  orderNotes: text('order_notes'),
  deliverySlot: text('delivery_slot'),
  deliveryDate: text('delivery_date'),
  trackingNumber: text('tracking_number'),
  deliveryPartner: text('delivery_partner'),
  cancellationReason: text('cancellation_reason'),
  cancelledAt: timestamp('cancelled_at'),
  returnStatus: text('return_status').default('None'), // 'None', 'Requested', 'Approved', 'Picked Up', 'Refunded', 'Rejected'
  returnReason: text('return_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
