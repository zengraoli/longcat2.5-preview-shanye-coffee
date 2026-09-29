import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import type { Database as DB } from 'better-sqlite3';

/**
 * 打开 SQLite 连接。T01 仅负责建连；建表与种子数据在 T02 的 migrate/seed 中完成。
 */
export function openDb(dbFile: string): DB {
  if (dbFile !== ':memory:') {
    mkdirSync(dirname(dbFile), { recursive: true });
  }
  const db = new Database(dbFile);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

let dbInstance: DB | null = null;

/** 获取（或创建）全局单例连接，供路由与服务层使用。 */
export function getDb(): DB {
  if (!dbInstance) {
    throw new Error('数据库尚未初始化，请先调用 initDb()');
  }
  return dbInstance;
}

export function setDb(db: DB) {
  dbInstance = db;
}

export async function initDb(dbFile: string): Promise<DB> {
  const db = openDb(dbFile);
  setDb(db);
  return db;
}
