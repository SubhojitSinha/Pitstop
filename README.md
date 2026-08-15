# Pitstop

A standalone mobile app for running a two/three-wheeler spare parts shop's day-to-day sales, purchases, and inventory — built to replace an existing Google AppSheet + Sheets setup with a native, offline-first experience.

## Stack

- **React Native + Expo** (SDK 54), **Expo Router** for file-based navigation
- **expo-sqlite** — local-first SQLite database; all reads/writes happen on-device, no network dependency for day-to-day use
- Class-based service layer (`db/services`) sitting between the UI and SQLite — screens never touch the database directly
- **TypeScript** throughout

## Features

- **Home** — today's sales total, days since last restock, a 14-day trend chart with tap-to-reveal tooltips, a "needs attention" list (products sold but never restocked), and tabbed Top sellers / Worth restocking insights
- **Sale / Purchase entry** — multi-line cart-style entry: pick any number of products from the catalog, adjust quantity and price per line, confirm the total before saving
- **Products** — searchable catalog with add/edit/delete (duplicate-name protection included), and a detail screen per product showing full sale/purchase history broken down by day, week, month, 6 months, 1 year, and all-time
- **Reports** — Sales/Purchases drill-down: Today → Yesterday → This/Last week → This/Last month → 6 months → 1 year, each level tappable down to the individual transactions on a given day, plus a custom date-range report
- **Settings** — light/dark/system theme (persisted), configurable Home "top sellers" count, CSV export (products/sales/purchases, with optional date range), and CSV-based restore/migration (merge-safe — re-importing a backup never creates duplicates)

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app on a physical device (Android or iOS) — no simulator or native build required for day-to-day development.

On first launch, the app seeds itself from the historical sales/purchase/product data bundled under `data/import/` (originally migrated from the shop's old Google Sheet).

## Project structure

```
app/                  Expo Router screens
  (tabs)/              Home, Sale, Purchase, Products, Reports
  product/[id].tsx     Product detail/insights
  report/              Drill-down report routes (months / days / day)
  settings.tsx
components/           Shared UI building blocks
db/
  Database.ts          expo-sqlite connection + schema
  models/               Row/domain types
  services/             ProductService, SaleService, PurchaseService,
                         DataExchangeService (CSV export/import) — all
                         class-based, injected with a shared Database
  HistoricalImporter.ts First-run seed from data/import/*.json
lib/                   Pure helpers — date ranges, CSV parsing, formatting
theme/                 Design tokens + light/dark/system theme context
```

## Building for distribution

Cloud builds via **EAS Build** (`eas build --platform android`) produce an installable APK/AAB without any local Android/iOS SDK setup.
