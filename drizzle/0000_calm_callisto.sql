CREATE TABLE IF NOT EXISTS "admin_users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'Manager' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"color" text,
	"item_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cms_banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"image" text NOT NULL,
	"mobile_image" text,
	"cta_text" text DEFAULT 'Shop Now',
	"cta_link" text DEFAULT '/categories',
	"type" text DEFAULT 'hero',
	"sort_order" integer DEFAULT 0,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cms_blogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"author" text DEFAULT 'Siri Traders Editorial',
	"category" text DEFAULT 'Grocery Tips',
	"cover_image" text,
	"tags" text,
	"is_published" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_blogs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cms_faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text DEFAULT 'General',
	"sort_order" integer DEFAULT 0,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cms_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text DEFAULT 'general',
	"meta_title" text,
	"meta_description" text,
	"is_published" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"discount" integer,
	"limit" integer,
	"type" text DEFAULT 'flat' NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"min_order" integer DEFAULT 0 NOT NULL,
	"max_discount" integer,
	"buy_quantity" integer DEFAULT 1,
	"get_quantity" integer DEFAULT 1,
	"target_type" text DEFAULT 'all',
	"target_category" text,
	"target_product_id" integer,
	"target_customer_email" text,
	"usage_limit" integer,
	"per_user_limit" integer DEFAULT 1,
	"times_used" integer DEFAULT 0,
	"total_discount_given" integer DEFAULT 0,
	"start_date" text,
	"end_date" text,
	"title" text,
	"description" text,
	"customer_type" text DEFAULT 'retail' NOT NULL,
	"active" boolean DEFAULT true,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "delivery_zones" (
	"id" text PRIMARY KEY NOT NULL,
	"area" text NOT NULL,
	"pincode" text NOT NULL,
	"time" text NOT NULL,
	"distance" text,
	"active" boolean DEFAULT true,
	"delivery_fee" integer DEFAULT 0 NOT NULL,
	"free_delivery_threshold" integer DEFAULT 0 NOT NULL,
	"handling_charge" integer DEFAULT 0 NOT NULL,
	"min_order_value" integer DEFAULT 0,
	"delivery_slots" jsonb DEFAULT '[]'::jsonb,
	"driver_assigned" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"change_type" text NOT NULL,
	"quantity" integer NOT NULL,
	"stock_before" integer NOT NULL,
	"stock_after" integer NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"batch_number" text,
	"admin_name" text DEFAULT 'Admin',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"available_stock" integer DEFAULT 50 NOT NULL,
	"reserved_stock" integer DEFAULT 0 NOT NULL,
	"damaged_stock" integer DEFAULT 0 NOT NULL,
	"returned_stock" integer DEFAULT 0 NOT NULL,
	"expired_stock" integer DEFAULT 0 NOT NULL,
	"incoming_stock" integer DEFAULT 0 NOT NULL,
	"reorder_level" integer DEFAULT 10 NOT NULL,
	"cost_price" integer DEFAULT 0 NOT NULL,
	"expiry_date" text,
	"batch_number" text,
	"location" text DEFAULT 'Main Shelf',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "offers" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"price" integer NOT NULL,
	"mrp" integer NOT NULL,
	"badge" text,
	"image" text,
	"link" text,
	"group_type" text DEFAULT 'daily',
	"type" text DEFAULT 'Sale offer',
	"buy_qty" integer DEFAULT 1,
	"get_qty" integer DEFAULT 1,
	"target_category" text,
	"target_product_id" integer,
	"start_date" text,
	"end_date" text,
	"usage_limit" integer,
	"times_claimed" integer DEFAULT 0,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" integer NOT NULL,
	"weight" text,
	"unit" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"total" integer NOT NULL,
	"status" text DEFAULT 'Pending',
	"delivery_address" text,
	"payment_method" text,
	"customer_name" text,
	"customer_phone" text,
	"customer_email" text,
	"payment_status" text DEFAULT 'Pending',
	"payment_txn_id" text,
	"payment_gateway" text DEFAULT 'Cash on Delivery',
	"refund_amount" integer DEFAULT 0,
	"refund_reason" text,
	"refunded_at" timestamp,
	"order_notes" text,
	"delivery_slot" text,
	"delivery_date" text,
	"tracking_number" text,
	"delivery_partner" text,
	"cancellation_reason" text,
	"cancelled_at" timestamp,
	"return_status" text DEFAULT 'None',
	"return_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"brand" text,
	"sku" text,
	"barcode" text,
	"weight" text,
	"unit" text,
	"pack_size" text,
	"price" integer NOT NULL,
	"mrp" integer,
	"cost_price" integer DEFAULT 0,
	"discount" integer,
	"gst_rate" integer DEFAULT 0,
	"hsn_code" text,
	"batch_number" text,
	"mfg_date" text,
	"expiry_date" text,
	"image" text,
	"description" text,
	"in_stock" boolean DEFAULT true,
	"is_archived" boolean DEFAULT false,
	"is_published" boolean DEFAULT true,
	"delivery_time" text DEFAULT '15 mins',
	"is_bestseller" boolean DEFAULT false,
	"is_todays_deal" boolean DEFAULT false,
	"wholesale_price" integer,
	"bulk_pack_label" text,
	"bulk_pack_price" integer,
	"wholesale_case_label" text,
	"wholesale_case_price" integer,
	"variants" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"comment" text,
	"status" text DEFAULT 'Approved',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seo_redirects" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_path" text NOT NULL,
	"target_path" text NOT NULL,
	"status_code" integer DEFAULT 301,
	"hits" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	CONSTRAINT "seo_redirects_source_path_unique" UNIQUE("source_path")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"delivery_fee" integer DEFAULT 25 NOT NULL,
	"free_delivery_threshold" integer DEFAULT 500 NOT NULL,
	"handling_charge" integer DEFAULT 5 NOT NULL,
	"announcement_text" text,
	"announcement_bg" text DEFAULT '#1C4B12',
	"announcement_color" text DEFAULT '#FFFFFF',
	"announcement_link" text DEFAULT '/categories',
	"announcement_active" boolean DEFAULT true,
	"meta_title" text,
	"meta_description" text,
	"canonical_url" text DEFAULT 'https://www.siritrader.com',
	"og_image" text,
	"robots_index" boolean DEFAULT true,
	"google_site_verification" text,
	"schema_json" text,
	"sitemap_enabled" boolean DEFAULT true,
	"header_menu" jsonb,
	"footer_menu" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"phone" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_categories_id_fk" FOREIGN KEY ("category") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
