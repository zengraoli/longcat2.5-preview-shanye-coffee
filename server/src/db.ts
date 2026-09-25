import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

let db: DatabaseSync | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  open_time TEXT NOT NULL,
  close_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  base_price INTEGER NOT NULL,
  image TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'on' CHECK(status IN ('on','off')),
  sold_out INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_specs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  cup_size TEXT NOT NULL DEFAULT 'medium' CHECK(cup_size IN ('medium','large')),
  temperature TEXT NOT NULL DEFAULT 'hot' CHECK(temperature IN ('iced','hot')),
  sugar TEXT NOT NULL DEFAULT 'standard' CHECK(sugar IN ('none','less','standard')),
  price_delta INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','staff')),
  store_id INTEGER REFERENCES stores(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled'))
);

CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive'))
);

CREATE TABLE IF NOT EXISTS promotion_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  promotion_id INTEGER NOT NULL REFERENCES promotions(id),
  product_id INTEGER NOT NULL REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('fixed','percent')),
  threshold INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT NOT NULL,
  total_count INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS user_coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES members(id),
  coupon_id INTEGER NOT NULL REFERENCES coupons(id),
  status TEXT NOT NULL DEFAULT 'unused' CHECK(status IN ('unused','used','expired')),
  claimed_at TEXT NOT NULL,
  used_at TEXT,
  order_id INTEGER
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT NOT NULL UNIQUE,
  pickup_code TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES members(id),
  store_id INTEGER NOT NULL REFERENCES stores(id),
  type TEXT NOT NULL CHECK(type IN ('pickup','dine_in')),
  status TEXT NOT NULL CHECK(status IN ('pending','paid','making','ready','completed','cancelled')),
  original_amount INTEGER NOT NULL,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  paid_amount INTEGER NOT NULL,
  coupon_id INTEGER,
  points_earned INTEGER NOT NULL DEFAULT 0,
  promo_discount INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  paid_at TEXT,
  cancelled_at TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  cup_size TEXT NOT NULL,
  temperature TEXT NOT NULL,
  sugar TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS points_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES members(id),
  order_id INTEGER,
  points INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  token TEXT PRIMARY KEY,
  user_type TEXT NOT NULL CHECK(user_type IN ('member','admin')),
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
`;

export function getDb(): DatabaseSync {
  if (db) return db;
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'shanYe.db');
  mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  const columns = (db.prepare('PRAGMA table_info(admin_users)').all() as Array<{ name: string }>).map((c) => c.name);
  if (!columns.includes('status')) {
    db.exec("ALTER TABLE admin_users ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled'))");
  }
  const orderColumns = (db.prepare('PRAGMA table_info(orders)').all() as Array<{ name: string }>).map((c) => c.name);
  if (!orderColumns.includes('promo_discount')) {
    db.exec("ALTER TABLE orders ADD COLUMN promo_discount INTEGER NOT NULL DEFAULT 0");
  }
  return db;
}
