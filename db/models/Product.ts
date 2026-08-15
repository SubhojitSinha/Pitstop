import type { PeriodBreakdown } from './PeriodStats';

export interface ProductRow {
  id: number;
  name: string;
  created_on: string;
  created_at: string;
  updated_on: string | null;
  updated_at: string | null;
}

export class Product {
  readonly id: number;
  readonly name: string;
  readonly createdOn: string;
  readonly createdAt: string;
  readonly updatedOn: string | null;
  readonly updatedAt: string | null;

  constructor(row: ProductRow) {
    this.id = row.id;
    this.name = row.name;
    this.createdOn = row.created_on;
    this.createdAt = row.created_at;
    this.updatedOn = row.updated_on;
    this.updatedAt = row.updated_at;
  }

  static fromRow(row: ProductRow): Product {
    return new Product(row);
  }

  static fromRows(rows: ProductRow[]): Product[] {
    return rows.map(Product.fromRow);
  }
}

/** Lightweight stats used by the Home "needs attention" list. */
export interface ProductStats {
  product: Product;
  totalSold: number;
  totalPurchased: number;
  everRestocked: boolean;
}

export interface LastActivity {
  date: string;
  time: string;
}

/** Full breakdown shown on the product detail screen. */
export interface ProductInsights {
  product: Product;
  sale: PeriodBreakdown;
  purchase: PeriodBreakdown;
  lastSale: LastActivity | null;
  lastPurchase: LastActivity | null;
}

/** A best-seller, ranked by units sold — shown on Home. */
export interface TopSellingProduct {
  product: Product;
  qty: number;
  amount: number;
}

/** A product selling fast relative to its last restock — surfaced on Home as a buying suggestion. */
export interface RestockSuggestion {
  product: Product;
  qtySoldSinceRestock: number;
  lastPurchaseDate: string | null;
}
