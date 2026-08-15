import { Database } from '../Database';
import { NewSale, Sale, SaleRow } from '../models/Sale';
import { LedgerService } from './LedgerService';

export class SaleService extends LedgerService {
  protected readonly table = 'sales' as const;

  constructor(db: Database) {
    super(db);
  }

  private async insertRow(sale: NewSale): Promise<number> {
    const totalPrice = sale.quantity * sale.price;
    const result = await this.db.runAsync(
      `INSERT INTO sales (product_id, quantity, price, total_price, date, time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sale.productId, sale.quantity, sale.price, totalPrice, sale.date, sale.time]
    );
    return result.lastInsertRowId;
  }

  async create(sale: NewSale): Promise<Sale> {
    const id = await this.insertRow(sale);
    const row = await this.db.getFirstAsync<SaleRow>('SELECT * FROM sales WHERE id = ?', [id]);
    if (!row) {
      throw new Error('Failed to load sale after insert');
    }
    return Sale.fromRow(row);
  }

  /** Inserts every line as its own sale row in one transaction — used for multi-product sale entries. */
  async createMany(sales: NewSale[]): Promise<void> {
    await this.db.transaction(async () => {
      for (const sale of sales) {
        await this.insertRow(sale);
      }
    });
  }

  async listByDate(date: string): Promise<Sale[]> {
    const rows = await this.db.getAllAsync<SaleRow>(
      'SELECT * FROM sales WHERE date = ? ORDER BY time DESC',
      [date]
    );
    return Sale.fromRows(rows);
  }

  async todayTotal(date: string): Promise<{ total: number; count: number }> {
    const row = await this.db.getFirstAsync<{ total: number | null; count: number }>(
      'SELECT SUM(total_price) as total, COUNT(*) as count FROM sales WHERE date = ?',
      [date]
    );
    return { total: row?.total ?? 0, count: row?.count ?? 0 };
  }
}
