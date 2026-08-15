import { Database } from '../Database';
import { parseCSVRecords, pickField, writeCSV } from '@/lib/csv';
import { normalizeFlexibleDate, normalizeFlexibleTime, DateRange } from '@/lib/periods';

export interface ImportResult {
  imported: number;
  skipped: number;
}

/**
 * CSV export/import for backup and restore. Export produces this app's own
 * round-trip format; import also tolerates the legacy AppSheet header names
 * (pid/product_name/create_date/create_time) so an old sheet export can be
 * brought in directly.
 */
export class DataExchangeService {
  constructor(private readonly db: Database) {}

  // ---------- Export ----------

  async exportProductsCSV(range?: DateRange): Promise<string> {
    const rows = range
      ? await this.db.getAllAsync<{
          id: number;
          name: string;
          created_on: string;
          created_at: string;
          updated_on: string | null;
          updated_at: string | null;
        }>('SELECT * FROM products WHERE created_on >= ? AND created_on <= ? ORDER BY id ASC', [
          range.start,
          range.end,
        ])
      : await this.db.getAllAsync<{
          id: number;
          name: string;
          created_on: string;
          created_at: string;
          updated_on: string | null;
          updated_at: string | null;
        }>('SELECT * FROM products ORDER BY id ASC');

    return writeCSV(
      ['id', 'name', 'created_on', 'created_at', 'updated_on', 'updated_at'],
      rows.map((r) => [r.id, r.name, r.created_on, r.created_at, r.updated_on ?? '', r.updated_at ?? ''])
    );
  }

  async exportSalesCSV(range?: DateRange): Promise<string> {
    return this.exportLedgerCSV('sales', range);
  }

  async exportPurchasesCSV(range?: DateRange): Promise<string> {
    return this.exportLedgerCSV('purchases', range);
  }

  private async exportLedgerCSV(table: 'sales' | 'purchases', range?: DateRange): Promise<string> {
    const rows = await this.db.getAllAsync<{
      id: number;
      product_id: number;
      product_name: string;
      quantity: number;
      price: number;
      total_price: number;
      date: string;
      time: string;
    }>(
      `SELECT t.id, t.product_id, p.name as product_name, t.quantity, t.price, t.total_price, t.date, t.time
       FROM ${table} t
       JOIN products p ON p.id = t.product_id
       ${range ? 'WHERE t.date >= ? AND t.date <= ?' : ''}
       ORDER BY t.date ASC, t.time ASC`,
      range ? [range.start, range.end] : []
    );

    return writeCSV(
      ['id', 'product_id', 'product_name', 'quantity', 'price', 'total_price', 'date', 'time'],
      rows.map((r) => [r.id, r.product_id, r.product_name, r.quantity, r.price, r.total_price, r.date, r.time])
    );
  }

  // ---------- Import ----------

  async importProductsCSV(text: string): Promise<ImportResult> {
    const records = parseCSVRecords(text);
    let imported = 0;
    let skipped = 0;

    await this.db.transaction(async () => {
      for (const record of records) {
        const name = pickField(record, ['name', 'product_name']);
        if (!name) {
          skipped += 1;
          continue;
        }
        const idField = pickField(record, ['id', 'pid']);
        const createdOnRaw = pickField(record, ['created_on', 'create_date']);
        const createdAtRaw = pickField(record, ['created_at', 'create_time']);
        const now = new Date();
        const createdOn = createdOnRaw ? normalizeFlexibleDate(createdOnRaw) : now.toISOString().slice(0, 10);
        const createdAt = createdAtRaw ? normalizeFlexibleTime(createdAtRaw) : now.toTimeString().slice(0, 8);
        const updatedOnRaw = pickField(record, ['updated_on']);
        const updatedAtRaw = pickField(record, ['updated_at']);
        const updatedOn = updatedOnRaw ? normalizeFlexibleDate(updatedOnRaw) : null;
        const updatedAt = updatedAtRaw ? normalizeFlexibleTime(updatedAtRaw) : null;

        if (idField && /^\d+$/.test(idField)) {
          const result = await this.db.runAsync(
            'INSERT OR IGNORE INTO products (id, name, created_on, created_at, updated_on, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [Number(idField), name, createdOn, createdAt, updatedOn, updatedAt]
          );
          result.changes > 0 ? (imported += 1) : (skipped += 1);
        } else {
          await this.db.runAsync(
            'INSERT INTO products (name, created_on, created_at, updated_on, updated_at) VALUES (?, ?, ?, ?, ?)',
            [name, createdOn, createdAt, updatedOn, updatedAt]
          );
          imported += 1;
        }
      }
    });

    return { imported, skipped };
  }

  async importSalesCSV(text: string): Promise<ImportResult> {
    return this.importLedgerCSV('sales', text);
  }

  async importPurchasesCSV(text: string): Promise<ImportResult> {
    return this.importLedgerCSV('purchases', text);
  }

  private async importLedgerCSV(table: 'sales' | 'purchases', text: string): Promise<ImportResult> {
    const records = parseCSVRecords(text);
    const validIds = new Set(
      (await this.db.getAllAsync<{ id: number }>('SELECT id FROM products')).map((r) => r.id)
    );

    let imported = 0;
    let skipped = 0;

    await this.db.transaction(async () => {
      for (const record of records) {
        const productIdField = pickField(record, ['product_id', 'pid']);
        const quantityField = pickField(record, ['quantity']);
        const priceField = pickField(record, ['price']);
        const dateField = pickField(record, ['date']);
        const timeField = pickField(record, ['time']);

        const productId = productIdField ? Number(productIdField) : NaN;
        const quantity = quantityField ? Number(quantityField) : NaN;
        const price = priceField ? Number(priceField) : NaN;

        if (!productId || !validIds.has(productId) || isNaN(quantity) || isNaN(price) || !dateField || !timeField) {
          skipped += 1;
          continue;
        }

        const date = normalizeFlexibleDate(dateField);
        const time = normalizeFlexibleTime(timeField);
        const totalPrice = quantity * price;
        const idField = pickField(record, ['id']);

        if (idField && /^\d+$/.test(idField)) {
          const result = await this.db.runAsync(
            `INSERT OR IGNORE INTO ${table} (id, product_id, quantity, price, total_price, date, time) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [Number(idField), productId, quantity, price, totalPrice, date, time]
          );
          result.changes > 0 ? (imported += 1) : (skipped += 1);
        } else {
          await this.db.runAsync(
            `INSERT INTO ${table} (product_id, quantity, price, total_price, date, time) VALUES (?, ?, ?, ?, ?, ?)`,
            [productId, quantity, price, totalPrice, date, time]
          );
          imported += 1;
        }
      }
    });

    return { imported, skipped };
  }
}
