import { Database } from '../Database';
import {
  Product,
  ProductInsights,
  ProductRow,
  ProductStats,
  RestockSuggestion,
  TopSellingProduct,
} from '../models/Product';
import { SaleService } from './SaleService';
import { PurchaseService } from './PurchaseService';

export class ProductService {
  constructor(
    private readonly db: Database,
    private readonly saleService: SaleService,
    private readonly purchaseService: PurchaseService
  ) {}

  async create(name: string): Promise<Product> {
    const now = new Date();
    const createdOn = now.toISOString().slice(0, 10);
    const createdAt = now.toTimeString().slice(0, 8);
    const result = await this.db.runAsync(
      'INSERT INTO products (name, created_on, created_at) VALUES (?, ?, ?)',
      [name, createdOn, createdAt]
    );
    const product = await this.getById(result.lastInsertRowId);
    if (!product) {
      throw new Error('Failed to load product after insert');
    }
    return product;
  }

  async update(id: number, name: string): Promise<Product> {
    const now = new Date();
    const updatedOn = now.toISOString().slice(0, 10);
    const updatedAt = now.toTimeString().slice(0, 8);
    await this.db.runAsync('UPDATE products SET name = ?, updated_on = ?, updated_at = ? WHERE id = ?', [
      name,
      updatedOn,
      updatedAt,
      id,
    ]);
    const product = await this.getById(id);
    if (!product) {
      throw new Error('Product not found after update');
    }
    return product;
  }

  /** Throws if the product has recorded sales/purchases (FK constraint) — callers should show a friendly message. */
  async remove(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM products WHERE id = ?', [id]);
  }

  async list(searchTerm = ''): Promise<Product[]> {
    const rows = searchTerm
      ? await this.db.getAllAsync<ProductRow>(
          'SELECT * FROM products WHERE name LIKE ? ORDER BY name ASC',
          [`%${searchTerm}%`]
        )
      : await this.db.getAllAsync<ProductRow>('SELECT * FROM products ORDER BY name ASC');
    return Product.fromRows(rows);
  }

  async getById(id: number): Promise<Product | null> {
    const row = await this.db.getFirstAsync<ProductRow>('SELECT * FROM products WHERE id = ?', [
      id,
    ]);
    return row ? Product.fromRow(row) : null;
  }

  async getStats(id: number): Promise<ProductStats | null> {
    const product = await this.getById(id);
    if (!product) return null;

    const soldRow = await this.db.getFirstAsync<{ total: number | null }>(
      'SELECT SUM(quantity) as total FROM sales WHERE product_id = ?',
      [id]
    );
    const purchasedRow = await this.db.getFirstAsync<{ total: number | null }>(
      'SELECT SUM(quantity) as total FROM purchases WHERE product_id = ?',
      [id]
    );

    const totalSold = soldRow?.total ?? 0;
    const totalPurchased = purchasedRow?.total ?? 0;

    return {
      product,
      totalSold,
      totalPurchased,
      everRestocked: totalPurchased > 0,
    };
  }

  /** Full sale/purchase period breakdown for the product detail screen. */
  async getInsights(id: number): Promise<ProductInsights | null> {
    const product = await this.getById(id);
    if (!product) return null;

    const [sale, purchase, lastSale, lastPurchase] = await Promise.all([
      this.saleService.periodStats(id),
      this.purchaseService.periodStats(id),
      this.saleService.lastActivityFor(id),
      this.purchaseService.lastActivityFor(id),
    ]);

    return { product, sale, purchase, lastSale, lastPurchase };
  }

  /** Products that have sold but were never restocked — surfaced on the Home "needs attention" list. */
  async needingAttention(limit = 5): Promise<ProductStats[]> {
    const rows = await this.db.getAllAsync<ProductRow & { total_sold: number }>(
      `SELECT p.*, SUM(s.quantity) as total_sold
       FROM products p
       JOIN sales s ON s.product_id = p.id
       WHERE p.id NOT IN (SELECT DISTINCT product_id FROM purchases)
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT ?`,
      [limit]
    );
    return rows.map((row) => ({
      product: Product.fromRow(row),
      totalSold: row.total_sold,
      totalPurchased: 0,
      everRestocked: false,
    }));
  }

  /** Best sellers by units sold, all-time — shown on Home. */
  async topSelling(limit = 5): Promise<TopSellingProduct[]> {
    const rows = await this.db.getAllAsync<ProductRow & { qty: number; amount: number }>(
      `SELECT p.*, SUM(s.quantity) as qty, SUM(s.total_price) as amount
       FROM products p
       JOIN sales s ON s.product_id = p.id
       GROUP BY p.id
       ORDER BY qty DESC
       LIMIT ?`,
      [limit]
    );
    return rows.map((row) => ({ product: Product.fromRow(row), qty: row.qty, amount: row.amount }));
  }

  /**
   * Products selling fastest relative to their last restock (or since creation, if never
   * restocked) — a proxy for "likely running low, worth buying more of" since stock-on-hand
   * isn't tracked directly.
   */
  async suggestedRestocks(limit = 5): Promise<RestockSuggestion[]> {
    const rows = await this.db.getAllAsync<
      ProductRow & { last_purchase_date: string | null; qty_since_restock: number }
    >(
      `SELECT p.*, lp.last_date as last_purchase_date,
              SUM(CASE WHEN s.date > COALESCE(lp.last_date, '0000-00-00') THEN s.quantity ELSE 0 END) as qty_since_restock
       FROM products p
       JOIN sales s ON s.product_id = p.id
       LEFT JOIN (SELECT product_id, MAX(date) as last_date FROM purchases GROUP BY product_id) lp
         ON lp.product_id = p.id
       GROUP BY p.id
       HAVING qty_since_restock > 0
       ORDER BY qty_since_restock DESC
       LIMIT ?`,
      [limit]
    );
    return rows.map((row) => ({
      product: Product.fromRow(row),
      qtySoldSinceRestock: row.qty_since_restock,
      lastPurchaseDate: row.last_purchase_date,
    }));
  }
}
