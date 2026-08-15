import AsyncStorage from '@react-native-async-storage/async-storage';

const TOP_SELLERS_COUNT_KEY = 'pitstop.topSellersCount';
export const DEFAULT_TOP_SELLERS_COUNT = 5;

export async function getTopSellersCount(): Promise<number> {
  const stored = await AsyncStorage.getItem(TOP_SELLERS_COUNT_KEY);
  const parsed = stored ? parseInt(stored, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TOP_SELLERS_COUNT;
}

export async function setTopSellersCount(count: number): Promise<void> {
  await AsyncStorage.setItem(TOP_SELLERS_COUNT_KEY, String(count));
}
