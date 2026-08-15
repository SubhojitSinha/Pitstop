import { Database } from './Database';
import productsData from '@/data/import/products.json';
import purchasesData from '@/data/import/purchases.json';
import salesData from '@/data/import/sales.json';

interface ImportProduct {
  id: number;
  name: string;
  createdOn: string;
  createdAt: string;
}

interface ImportTxn {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  date: string;
  time: string;
}

const CHUNK_SIZE = 200;

/**
 * One-time loader for the real historical data exported from the old
 * AppSheet Google Sheet (products.json / sales.json / purchases.json under
 * data/import, generated from the shop's actual CSVs). Original PIDs and
 * transaction IDs are preserved on insert since nothing else references them
 * by position — only by these exact numbers.
 */
export class HistoricalImporter {
  constructor(private readonly db: Database) {}

  async importIfEmpty(): Promise<boolean> {
    const existing = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM products'
    );
    if ((existing?.count ?? 0) > 0) return false;

    await this.db.transaction(async () => {
      await this.insertProducts(productsData as ImportProduct[]);
      await this.insertTxns('purchases', purchasesData as ImportTxn[]);
      await this.insertTxns('sales', salesData as ImportTxn[]);
    });

    return true;
  }

  private async insertProducts(rows: ImportProduct[]): Promise<void> {
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const placeholders = chunk.map(() => '(?, ?, ?, ?)').join(',');
      const params = chunk.flatMap((p) => [p.id, p.name, p.createdOn, p.createdAt]);
      await this.db.runAsync(
        `INSERT OR IGNORE INTO products (id, name, created_on, created_at) VALUES ${placeholders}`,
        params
      );
    }
  }

  private async insertTxns(table: 'sales' | 'purchases', rows: ImportTxn[]): Promise<void> {
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',');
      const params = chunk.flatMap((t) => [
        t.id,
        t.productId,
        t.quantity,
        t.price,
        t.quantity * t.price,
        t.date,
        t.time,
      ]);
      await this.db.runAsync(
        `INSERT OR IGNORE INTO ${table} (id, product_id, quantity, price, total_price, date, time) VALUES ${placeholders}`,
        params
      );
    }
  }
}
