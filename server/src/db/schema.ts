import type { Database } from 'better-sqlite3';

/**
 * 建表语句。所有金额字段均为整数“分”，时间字段为 UTC ISO8601 字符串。
 */
const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    open_time TEXT NOT NULL DEFAULT '08:00',
    close_time TEXT NOT NULL DEFAULT '21:00',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
    sort INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','staff')),
    store_id INTEGER REFERENCES stores(id),
    enabled INTEGER NOT NULL DEFAULT 1
  )`,

  `CREATE TABLE IF NOT EXISTS admin_tokens (
    token TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins(id),
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    nickname TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS member_tokens (
    token TEXT PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id),
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    sort INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    image TEXT,
    status TEXT NOT NULL DEFAULT 'on' CHECK (status IN ('on','off')),
    sold_out INTEGER NOT NULL DEFAULT 0,
    drink INTEGER NOT NULL DEFAULT 0,
    sort INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS product_specs (
    id INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    cup TEXT NOT NULL CHECK (cup IN ('medium','large')),
    temperature TEXT NOT NULL CHECK (temperature IN ('ice','hot')),
    sugar TEXT NOT NULL CHECK (sugar IN ('none','less','standard')),
    price_adjust INTEGER NOT NULL DEFAULT 0,
    UNIQUE (product_id, cup, temperature, sugar)
  )`,

  `CREATE TABLE IF NOT EXISTS coupon_templates (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('full_reduction','discount')),
    threshold INTEGER NOT NULL DEFAULT 0,
    discount_amount INTEGER,
    discount_rate INTEGER,
    valid_days INTEGER NOT NULL DEFAULT 30,
    total_stock INTEGER NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS member_coupons (
    id INTEGER PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id),
    template_id INTEGER NOT NULL REFERENCES coupon_templates(id),
    status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused','used','expired')),
    claimed_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    order_id INTEGER
  )`,

  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    order_no TEXT NOT NULL UNIQUE,
    member_id INTEGER REFERENCES members(id),
    store_id INTEGER NOT NULL REFERENCES stores(id),
    type TEXT NOT NULL CHECK (type IN ('pickup','dine_in')),
    status TEXT NOT NULL DEFAULT 'pending_payment'
      CHECK (status IN ('pending_payment','paid','making','ready','completed','cancelled')),
    pickup_code TEXT,
    original_amount INTEGER NOT NULL DEFAULT 0,
    promo_discount_amount INTEGER NOT NULL DEFAULT 0,
    discount_amount INTEGER NOT NULL DEFAULT 0,
    payable_amount INTEGER NOT NULL DEFAULT 0,
    coupon_id INTEGER,
    remark TEXT,
    created_at TEXT NOT NULL,
    paid_at TEXT,
    cancelled_at TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS store_products (
    store_id INTEGER NOT NULL REFERENCES stores(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    sold_out INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (store_id, product_id)
  )`,

  `CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'second_cup_half' CHECK (type = 'second_cup_half'),
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS promotion_products (
    id INTEGER PRIMARY KEY,
    promotion_id INTEGER NOT NULL REFERENCES promotions(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    UNIQUE (promotion_id, product_id)
  )`,

  `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    cup TEXT,
    temperature TEXT,
    sugar TEXT,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS point_logs (
    id INTEGER PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id),
    order_id INTEGER,
    points INTEGER NOT NULL,
    balance INTEGER NOT NULL,
    remark TEXT,
    created_at TEXT NOT NULL
  )`,
];

/** 建表（幂等：IF NOT EXISTS）。 */
export function migrate(db: Database) {
  for (const sql of STATEMENTS) {
    db.exec(sql);
  }
  // 兼容旧库：补 drink 列
  const cols = db.prepare('PRAGMA table_info(products)').all() as { name: string }[];
  if (!cols.some((c) => c.name === 'drink')) {
    db.exec('ALTER TABLE products ADD COLUMN drink INTEGER NOT NULL DEFAULT 0');
  }
  // 兼容旧库：补 coupon_templates.enabled 列
  const tcols = db.prepare('PRAGMA table_info(coupon_templates)').all() as { name: string }[];
  if (!tcols.some((c) => c.name === 'enabled')) {
    db.exec('ALTER TABLE coupon_templates ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1');
  }
  // 兼容旧库：补 admins.enabled 列
  const acols = db.prepare('PRAGMA table_info(admins)').all() as { name: string }[];
  if (!acols.some((c) => c.name === 'enabled')) {
    db.exec('ALTER TABLE admins ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1');
  }
  // 兼容旧库：补 orders.promo_discount_amount 列
  const ocols = db.prepare('PRAGMA table_info(orders)').all() as { name: string }[];
  if (!ocols.some((c) => c.name === 'promo_discount_amount')) {
    db.exec('ALTER TABLE orders ADD COLUMN promo_discount_amount INTEGER NOT NULL DEFAULT 0');
  }
}
