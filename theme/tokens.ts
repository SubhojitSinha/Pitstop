export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  line: string;
  lineStrong: string;
  sale: string;
  saleBg: string;
  saleInk: string;
  purchase: string;
  purchaseBg: string;
  purchaseInk: string;
  danger: string;
  dangerBg: string;
  onSale: string;
  onPurchase: string;
}

export const lightColors: ThemeColors = {
  bg: '#F2EFE7',
  surface: '#FFFFFF',
  surface2: '#FBF7EF',
  ink: '#1C1A16',
  inkSoft: '#5C574C',
  inkFaint: '#948D7C',
  line: 'rgba(28,26,22,0.13)',
  lineStrong: 'rgba(28,26,22,0.24)',
  sale: '#DD5A26',
  saleBg: '#FAE1D2',
  saleInk: '#7A2E0E',
  purchase: '#1B6B72',
  purchaseBg: '#DBEAE9',
  purchaseInk: '#0D3A3E',
  danger: '#AE3324',
  dangerBg: '#F5DCD6',
  onSale: '#FFFFFF',
  onPurchase: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  bg: '#14130F',
  surface: '#1F1D18',
  surface2: '#26231C',
  ink: '#F1ECE1',
  inkSoft: '#B7AE9C',
  inkFaint: '#837A68',
  line: 'rgba(241,236,225,0.14)',
  lineStrong: 'rgba(241,236,225,0.26)',
  sale: '#FF8A50',
  saleBg: 'rgba(255,138,80,0.17)',
  saleInk: '#FFD4B8',
  purchase: '#4CAEAF',
  purchaseBg: 'rgba(76,174,175,0.17)',
  purchaseInk: '#C8ECEB',
  danger: '#E27263',
  dangerBg: 'rgba(226,114,99,0.17)',
  onSale: '#1C1A16',
  onPurchase: '#1C1A16',
};

export const radius = {
  control: 7,
  card: 16,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;
