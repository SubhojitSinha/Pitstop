import { Database } from '../Database';
import { NewPurchase, Purchase, PurchaseRow, RestockEvent } from '../models/Purchase';
import { LedgerService } from './LedgerService';

export class PurchaseService extends LedgerService {
  protected readonly table = 'purchases' as const;

  constructor(db: Database) {
    super(db);
  }

  private async insertRow(purchase: NewPurchase): Promise<number> {
    const totalPrice = purchase.quantity * purchase.price;
    const result = await this.db.runAsync(
      `INSERT INTO purchases (product_id, quantity, price, total_price, date, time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [purchase.productId, purchase.quantity, purchase.price, totalPrice, purchase.date, purchase.time]
    );
    return result.lastInsertRowId;
  }

  async create(purchase: NewPurchase): Promise<Purchase> {
    const id = await this.insertRow(purchase);
    const row = await this.db.getFirstAsync<PurchaseRow>('SELECT * FROM purchases WHERE id = ?', [id]);
    if (!row) {
      throw new Error('Failed to load purchase after insert');
    }
    return Purchase.fromRow(row);
  }

  /** Inserts every line as its own purchase row in one transaction — used for multi-product purchase entries. */
  async createMany(purchases: NewPurchase[]): Promise<void> {
    await this.db.transaction(async () => {
      for (const purchase of purchases) {
        await this.insertRow(purchase);
      }
    });
  }

  async listByDate(date: string): Promise<Purchase[]> {
    const rows = await this.db.getAllAsync<PurchaseRow>(
      'SELECT * FROM purchases WHERE date = ? ORDER BY time DESC',
      [date]
    );
    return Purchase.fromRows(rows);
  }

  /** Restocks are rare and bulk, so reports show them as a timeline of events rather than a daily chart. */
  async timeline(): Promise<RestockEvent[]> {
    const rows = await this.db.getAllAsync<RestockEvent>(
      `SELECT date, SUM(total_price) as total
       FROM purchases
       GROUP BY date
       ORDER BY date DESC`
    );
    return rows;
  }

  async lastRestock(): Promise<RestockEvent | null> {
    const rows = await this.timeline();
    return rows[0] ?? null;
  }
}
