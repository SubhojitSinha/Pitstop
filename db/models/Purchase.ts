export interface PurchaseRow {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  total_price: number;
  date: string;
  time: string;
}

export interface NewPurchase {
  productId: number;
  quantity: number;
  price: number;
  date: string;
  time: string;
}

export class Purchase {
  readonly id: number;
  readonly productId: number;
  readonly quantity: number;
  readonly price: number;
  readonly totalPrice: number;
  readonly date: string;
  readonly time: string;

  constructor(row: PurchaseRow) {
    this.id = row.id;
    this.productId = row.product_id;
    this.quantity = row.quantity;
    this.price = row.price;
    this.totalPrice = row.total_price;
    this.date = row.date;
    this.time = row.time;
  }

  static fromRow(row: PurchaseRow): Purchase {
    return new Purchase(row);
  }

  static fromRows(rows: PurchaseRow[]): Purchase[] {
    return rows.map(Purchase.fromRow);
  }
}

export interface RestockEvent {
  date: string;
  total: number;
}
