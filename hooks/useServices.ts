import { productService, saleService, purchaseService, dataExchangeService } from '@/db/container';

// Trivial shims that hand screens the singleton service instances. Kept as
// hooks (rather than importing db/container directly in screens) so the
// class-based services stay swappable/mockable in tests.
export const useProductService = () => productService;
export const useSaleService = () => saleService;
export const usePurchaseService = () => purchaseService;
export const useDataExchangeService = () => dataExchangeService;
