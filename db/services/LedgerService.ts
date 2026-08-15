import { Database } from '../Database';
import { Product, ProductRow } from '../models/Product';
import { PeriodBreakdown, PeriodBucket } from '../models/PeriodStats';
import { DayTotal, LedgerRecord, MonthTotal, ReportSummary } from '../models/Report';
import { computePeriodRanges, computeReportRanges, DateRange, generateCalendarDates, MonthBucket } from '@/lib/periods';

/**
 * Shared query logic for the sales and purchases tables — both are
 * "ledger" tables with the same shape (product_id, quantity, price,
 * total_price, date, time). Subclasses supply the table name and add
 * their own table-specific methods (e.g. dailyTotals for sales, timeline
 * for purchases).
 */
export abstract class LedgerService {
  protected abstract readonly table: 'sales' | 'purchases';

  constructor(protected readonly db: Database) {}

  async recentProducts(limit = 6): Promise<Product[]> {
    const rows = await this.db.getAllAsync<ProductRow>(
      `SELECT p.* FROM products p
       WHERE p.id IN (
         SELECT product_id FROM ${this.table} GROUP BY product_id ORDER BY MAX(date) DESC, MAX(time) DESC LIMIT ?
       )`,
      [limit]
    );
    return Product.fromRows(rows);
  }

  async lastPriceFor(productId: number): Promise<number | null> {
    const row = await this.db.getFirstAsync<{ price: number }>(
      `SELECT price FROM ${this.table} WHERE product_id = ? ORDER BY date DESC, time DESC LIMIT 1`,
      [productId]
    );
    return row?.price ?? null;
  }

  async lastActivityFor(productId: number): Promise<{ date: string; time: string } | null> {
    return this.db.getFirstAsync<{ date: string; time: string }>(
      `SELECT date, time FROM ${this.table} WHERE product_id = ? ORDER BY date DESC, time DESC LIMIT 1`,
      [productId]
    );
  }

  private async bucketFor(productId: number, range: DateRange): Promise<PeriodBucket> {
    const row = await this.db.getFirstAsync<{ qty: number | null; amount: number | null }>(
      `SELECT SUM(quantity) as qty, SUM(total_price) as amount
       FROM ${this.table}
       WHERE product_id = ? AND date >= ? AND date <= ?`,
      [productId, range.start, range.end]
    );
    return { qty: row?.qty ?? 0, amount: row?.amount ?? 0 };
  }

  private async allTimeBucket(productId: number): Promise<PeriodBucket> {
    const row = await this.db.getFirstAsync<{ qty: number | null; amount: number | null }>(
      `SELECT SUM(quantity) as qty, SUM(total_price) as amount FROM ${this.table} WHERE product_id = ?`,
      [productId]
    );
    return { qty: row?.qty ?? 0, amount: row?.amount ?? 0 };
  }

  async periodStats(productId: number, reference: Date = new Date()): Promise<PeriodBreakdown> {
    const ranges = computePeriodRanges(reference);
    const [last7Days, thisMonth, lastMonth, last6Months, last12Months, allTime] = await Promise.all([
      this.bucketFor(productId, ranges.last7Days),
      this.bucketFor(productId, ranges.thisMonth),
      this.bucketFor(productId, ranges.lastMonth),
      this.bucketFor(productId, ranges.last6Months),
      this.bucketFor(productId, ranges.last12Months),
      this.allTimeBucket(productId),
    ]);
    return { last7Days, thisMonth, lastMonth, last6Months, last12Months, allTime };
  }

  /** Same as bucketFor, but across every product — used by the Reports screen. */
  async bucketForRange(range: DateRange): Promise<PeriodBucket> {
    const row = await this.db.getFirstAsync<{ qty: number | null; amount: number | null }>(
      `SELECT SUM(quantity) as qty, SUM(total_price) as amount FROM ${this.table} WHERE date >= ? AND date <= ?`,
      [range.start, range.end]
    );
    return { qty: row?.qty ?? 0, amount: row?.amount ?? 0 };
  }

  /** The 8 drill-down summary buckets shown on the Reports screen. */
  async reportSummary(reference: Date = new Date()): Promise<ReportSummary> {
    const ranges = computeReportRanges(reference);
    const [today, yesterday, thisWeek, lastWeek, thisMonth, lastMonth, last6Months, last12Months] =
      await Promise.all([
        this.bucketForRange(ranges.today),
        this.bucketForRange(ranges.yesterday),
        this.bucketForRange(ranges.thisWeek),
        this.bucketForRange(ranges.lastWeek),
        this.bucketForRange(ranges.thisMonth),
        this.bucketForRange(ranges.lastMonth),
        this.bucketForRange(ranges.last6Months),
        this.bucketForRange(ranges.last12Months),
      ]);
    return { today, yesterday, thisWeek, lastWeek, thisMonth, lastMonth, last6Months, last12Months };
  }

  /** Every calendar date in `range`, zero-filled where there's no activity — for charts and day-list drill-downs. */
  async dailyTotalsInRange(range: DateRange): Promise<DayTotal[]> {
    const rows = await this.db.getAllAsync<{ date: string; qty: number; amount: number }>(
      `SELECT date, SUM(quantity) as qty, SUM(total_price) as amount FROM ${this.table}
       WHERE date >= ? AND date <= ? GROUP BY date`,
      [range.start, range.end]
    );
    const byDate = new Map(rows.map((r) => [r.date, r]));
    return generateCalendarDates(range).map((date) => {
      const found = byDate.get(date);
      return { date, qty: found?.qty ?? 0, amount: found?.amount ?? 0 };
    });
  }

  /** Totals for each pre-computed month bucket — used by the month-list drill-down. */
  async monthlyTotals(buckets: MonthBucket[]): Promise<MonthTotal[]> {
    return Promise.all(
      buckets.map(async (bucket) => {
        const total = await this.bucketForRange(bucket.range);
        return { key: bucket.key, qty: total.qty, amount: total.amount };
      })
    );
  }

  /** Every individual record on one date, product names joined in — the deepest drill-down level. */
  async recordsForDate(date: string): Promise<LedgerRecord[]> {
    const rows = await this.db.getAllAsync<{
      id: number;
      product_id: number;
      product_name: string;
      quantity: number;
      price: number;
      total_price: number;
      time: string;
    }>(
      `SELECT t.id, t.product_id, p.name as product_name, t.quantity, t.price, t.total_price, t.time
       FROM ${this.table} t
       JOIN products p ON p.id = t.product_id
       WHERE t.date = ?
       ORDER BY t.time DESC`,
      [date]
    );
    return rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      quantity: r.quantity,
      price: r.price,
      totalPrice: r.total_price,
      time: r.time,
    }));
  }
}
