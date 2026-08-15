import type { PeriodBucket } from './PeriodStats';

export interface ReportSummary {
  today: PeriodBucket;
  yesterday: PeriodBucket;
  thisWeek: PeriodBucket;
  lastWeek: PeriodBucket;
  thisMonth: PeriodBucket;
  lastMonth: PeriodBucket;
  last6Months: PeriodBucket;
  last12Months: PeriodBucket;
}

export interface DayTotal {
  date: string;
  qty: number;
  amount: number;
}

export interface MonthTotal {
  key: string; // 'YYYY-MM'
  qty: number;
  amount: number;
}

export interface LedgerRecord {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  time: string;
}
