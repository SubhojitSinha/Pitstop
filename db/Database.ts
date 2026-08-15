import * as SQLite from 'expo-sqlite';
import type { SQLiteBindParams, SQLiteRunResult } from 'expo-sqlite';

const DATABASE_NAME = 'pitstop-v3.db';

const SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_on TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_on TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    total_price REAL NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    total_price REAL NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);
  CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
  CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(product_id);
  CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
`;

/**
 * Thin wrapper around the expo-sqlite connection. Services depend on this
 * class rather than importing expo-sqlite directly, so the storage engine
 * can change later without touching business logic.
 */
export class Database {
  private static instance: Database | null = null;

  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.setup();
    }
    return this.initPromise;
  }

  private async setup(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await this.db.execAsync(SCHEMA);
  }

  private handle(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database used before init() completed');
    }
    return this.db;
  }

  async execAsync(sql: string): Promise<void> {
    await this.handle().execAsync(sql);
  }

  async runAsync(sql: string, params: SQLiteBindParams = []): Promise<SQLiteRunResult> {
    return this.handle().runAsync(sql, params);
  }

  async getAllAsync<T>(sql: string, params: SQLiteBindParams = []): Promise<T[]> {
    return this.handle().getAllAsync<T>(sql, params);
  }

  async getFirstAsync<T>(sql: string, params: SQLiteBindParams = []): Promise<T | null> {
    return this.handle().getFirstAsync<T>(sql, params);
  }

  async transaction(task: () => Promise<void>): Promise<void> {
    await this.handle().withTransactionAsync(task);
  }
}
