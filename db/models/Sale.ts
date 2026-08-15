export interface SaleRow {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  total_price: number;
  date: string;
  time: string;
}

export interface NewSale {
  productId: number;
  quantity: number;
  price: number;
  date: string;
  time: string;
}

export class Sale {
  readonly id: number;
  readonly productId: number;
  readonly quantity: number;
  readonly price: number;
  readonly totalPrice: number;
  readonly date: string;
  readonly time: string;

  constructor(row: SaleRow) {
    this.id = row.id;
    this.productId = row.product_id;
    this.quantity = row.quantity;
    this.price = row.price;
    this.totalPrice = row.total_price;
    this.date = row.date;
    this.time = row.time;
  }

  static fromRow(row: SaleRow): Sale {
    return new Sale(row);
  }

  static fromRows(rows: SaleRow[]): Sale[] {
    return rows.map(Sale.fromRow);
  }
}
