export interface PeriodBucket {
  qty: number;
  amount: number;
}

export interface PeriodBreakdown {
  last7Days: PeriodBucket;
  thisMonth: PeriodBucket;
  lastMonth: PeriodBucket;
  last6Months: PeriodBucket;
  last12Months: PeriodBucket;
  allTime: PeriodBucket;
}
