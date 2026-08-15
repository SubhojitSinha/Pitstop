import { Database } from './Database';
import { ProductService } from './services/ProductService';
import { SaleService } from './services/SaleService';
import { PurchaseService } from './services/PurchaseService';
import { DataExchangeService } from './services/DataExchangeService';
import { HistoricalImporter } from './HistoricalImporter';

const database = Database.getInstance();

export const saleService = new SaleService(database);
export const purchaseService = new PurchaseService(database);
export const productService = new ProductService(database, saleService, purchaseService);
export const dataExchangeService = new DataExchangeService(database);
export const historicalImporter = new HistoricalImporter(database);

export async function initDatabase(): Promise<void> {
  await database.init();
  await historicalImporter.importIfEmpty();
}
