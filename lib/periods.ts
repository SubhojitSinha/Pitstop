export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Normalizes a date string to 'YYYY-MM-DD'. Accepts our own export format (already ISO)
 * and the legacy 'M/D/YYYY' format the original AppSheet sheet used.
 */
export function normalizeFlexibleDate(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, month, day, year] = m;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  throw new Error(`Unrecognized date format: ${value}`);
}

/** Normalizes a time string to 'HH:MM:SS'. */
export function normalizeFlexibleTime(value: string): string {
  const parts = value.trim().split(':');
  if (parts.length < 2) throw new Error(`Unrecognized time format: ${value}`);
  return parts.map((p) => p.padStart(2, '0')).join(':').slice(0, 8);
}

export interface DateRange {
  start: string;
  end: string;
}

/** The `n` calendar days ending today (inclusive). */
export function lastNDaysRange(n: number, reference: Date = new Date()): DateRange {
  const start = new Date(reference);
  start.setDate(start.getDate() - (n - 1));
  return { start: toISODate(start), end: toISODate(reference) };
}

export interface PeriodRanges {
  last7Days: DateRange;
  thisMonth: DateRange;
  lastMonth: DateRange;
  last6Months: DateRange;
  last12Months: DateRange;
}

/** Computes the date-range boundaries (inclusive, 'YYYY-MM-DD') for each reporting bucket. */
export function computePeriodRanges(reference: Date = new Date()): PeriodRanges {
  const end = toISODate(reference);

  const sevenDaysAgo = new Date(reference);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const thisMonthStart = new Date(reference.getFullYear(), reference.getMonth(), 1);

  const lastMonthStart = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  const lastMonthEnd = new Date(reference.getFullYear(), reference.getMonth(), 0);

  const sixMonthsAgo = new Date(reference);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const twelveMonthsAgo = new Date(reference);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  return {
    last7Days: { start: toISODate(sevenDaysAgo), end },
    thisMonth: { start: toISODate(thisMonthStart), end },
    lastMonth: { start: toISODate(lastMonthStart), end: toISODate(lastMonthEnd) },
    last6Months: { start: toISODate(sixMonthsAgo), end },
    last12Months: { start: toISODate(twelveMonthsAgo), end },
  };
}

/** Monday-start week boundary containing `d`. */
function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = Sun .. 6 = Sat
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday;
}

export interface ReportRanges {
  today: DateRange;
  yesterday: DateRange;
  thisWeek: DateRange;
  lastWeek: DateRange;
  thisMonth: DateRange;
  lastMonth: DateRange;
  last6Months: DateRange;
  last12Months: DateRange;
}

/** The 8 drill-down buckets shown on the Reports screen. */
export function computeReportRanges(reference: Date = new Date()): ReportRanges {
  const periods = computePeriodRanges(reference);

  const yesterday = new Date(reference);
  yesterday.setDate(yesterday.getDate() - 1);

  const thisWeekStart = startOfWeek(reference);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(thisWeekStart.getDate() - 1);

  const todayIso = toISODate(reference);

  return {
    today: { start: todayIso, end: todayIso },
    yesterday: { start: toISODate(yesterday), end: toISODate(yesterday) },
    thisWeek: { start: toISODate(thisWeekStart), end: toISODate(thisWeekEnd) },
    lastWeek: { start: toISODate(lastWeekStart), end: toISODate(lastWeekEnd) },
    thisMonth: periods.thisMonth,
    lastMonth: periods.lastMonth,
    last6Months: periods.last6Months,
    last12Months: periods.last12Months,
  };
}

/** Every calendar date in [start, end] inclusive, ascending. */
export function generateCalendarDates(range: DateRange): string[] {
  const dates: string[] = [];
  const cursor = parseISODate(range.start);
  const end = parseISODate(range.end);
  while (cursor <= end) {
    dates.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export interface MonthBucket {
  key: string; // 'YYYY-MM'
  range: DateRange;
}

/** `count` calendar months ending at `anchor`'s month (inclusive), most recent first. */
export function computeMonthBuckets(count: number, anchor: Date = new Date()): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  for (let i = 0; i < count; i += 1) {
    const monthDate = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() - i + 1, 0);
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({ key, range: { start: toISODate(monthDate), end: toISODate(monthEnd) } });
  }
  return buckets;
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function formatRangeLabel(range: DateRange): string {
  if (range.start === range.end) {
    return parseISODate(range.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const start = parseISODate(range.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const end = parseISODate(range.end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${start} – ${end}`;
}
