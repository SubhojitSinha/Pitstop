# Shop Sales & Purchase App — Project Reference Doc

*Created: August 14, 2026*
*Purpose: Reference for continuing this project in a new session (previous discussion was in an incognito chat with no memory).*

---

## 1. Background / Current State

- Currently using **Google AppSheet** connected to a **Google Sheet** to run shop operations.
- Existing AppSheet app includes:
  - Sale entry screen
  - Purchase entry screen
  - Daily sale report
  - Purchase report
  - (Possibly more — to confirm once screenshots are shared)
- **Goal:** Rebuild this as a **fully functional, standalone Android app** with an **entirely new UI** (not a copy of AppSheet's UI — a full restructure).
- **Constraint:** Very limited local disk space — ruled out Android Studio / Flutter + Android SDK (5–9 GB footprint).

---

## 2. Technology Decision

**Chosen stack: React Native + Expo**

Why:
- Local disk usage: **~1–2 GB total** (Node.js, VS Code, Expo CLI, node_modules) — no Android SDK, no Gradle, no emulator needed.
- Development/testing done live on a physical phone using the **Expo Go** app (scan QR code, instant reload) — zero local build step during development.
- Final APK/AAB builds happen in the cloud via **EAS Build** (`eas build --platform android`) — not on the local machine.
- **EAS Build free tier:** 15 Android + 15 iOS builds/month, resets monthly. Paid tiers start ~$19/month if ever needed (unlikely for this use case).
- Output options:
  - **APK** — for direct install/sideload on shop devices
  - **AAB** — required if publishing to Google Play Store later

**Rejected/alternative options considered:**
- Flutter + Android Studio/SDK — too much local disk usage (5–9 GB)
- FlutterFlow — viable no-code cloud alternative, but React Native/Expo was chosen instead
- PWA wrapping — viable lightweight alternative, not chosen
- Staying on AppSheet — ruled out since a native rebuild is the actual goal

---

## 3. Data Architecture

**Local-first design using SQLite (via `expo-sqlite`):**
- All day-to-day operations (sale entry, purchase entry, report viewing) read/write to a **local SQLite database** on the phone.
- Fully offline-capable, fast, no API rate limits, no lag during live shop use.

**Google Sheets used as historic/durable archive — NOT as the live operational database:**
- Avoids Google Sheets API rate limits and slowness from frequent read/write.
- Sheets remains the permanent historic record, synced in batches rather than per-transaction.

**Cycle-close / backup mechanism (manual, user-triggered):**
- A dedicated **"Close Cycle" / "Backup" button** in the UI (not automatic/scheduled — full user control).
- On tap, the flow is:
  1. Read all rows from local `active_sales` (and `active_purchases`) SQLite tables.
  2. Create a **new dated tab** in the Google Sheet (e.g., `Sales_2026-08-14`) via the Sheets API — avoids the fragility of renaming existing tabs (Sheets tabs have an internal `sheetId` separate from their display name; renaming can break name-based references).
  3. Batch-write all local rows into that new tab.
  4. **Only after confirmed successful write** — clear the local active tables. (Critical: never clear local data before confirming the remote write succeeded, to avoid data loss on network failure.)
  5. Show confirmation to user (e.g., "Backed up 47 sales to Sales_2026-08-14. Ready for new cycle.")
- Additional safeguards to build in:
  - Display **timestamp of last successful backup** on screen.
  - **Confirmation dialog** before erasing local data.
  - Optional **secondary local backup** (rolling local archive table or JSON export) as a belt-and-suspenders safety net.

**Definition of "cycle" — still to be finalized** (daily, weekly, monthly, or tied to inventory counts). Affects whether this stays a manual button (current plan) — already decided as manual per user preference.

---

## 4. Migration Requirement (Important — Not Yet Started)

- Need an **"Import from Sheet" migration flow** for **first-time setup**, since existing Products and Purchase history live in the current Google Sheet.
- Planned approach:
  1. Pull existing Products/Purchases (and other master data) from the Google Sheet via API (one-time, or repeatable).
  2. Map Sheet columns into the new SQLite schema.
  3. Let user review/confirm mapping before committing (in case column meanings have shifted over time in the old sheet).

---

## 5. Information Still Needed From User (Next Steps)

User has agreed to provide:
1. ~~Screenshots of all current AppSheet screens~~ — **DONE, see Section 7 below** (17 screenshots analyzed on Aug 15, 2026).
2. **Sample CSV exports of each Google Sheet tab** — e.g., Products, Sales, Purchases, Suppliers/Parties if they exist. A few dozen real or representative rows is enough. Needed to understand column names, data types, and relationships (e.g., does a Sale reference a Product by name or ID?). **Still pending — user needs to get access first.**

**Open questions — status after screenshot analysis:**
- ~~Does each product have a unique ID/code, or just a name?~~ **Answered:** yes, each product has a `Product ID` (looks sequential, e.g. 109, 606, 147) plus `Product Name`.
- Is stock quantity tracked directly, or calculated (purchases minus sales)? **Partially answered:** no stock/quantity-on-hand field exists anywhere in the current app's Products screen — so today it is NOT tracked directly in-app. Unclear if it's tracked manually outside the app. **Still need to confirm with user.**
- Any other master data beyond Products (Suppliers, Customers, Categories)? **Answered:** No — no supplier, customer, or category fields/screens found anywhere in the app.
- ~~Sale entry: single product per entry, or multi-product/cart-style invoice?~~ **Answered:** single product per entry. Each sale is its own row (product, qty, unit price, total); multiple line items on the same day are just grouped visually under a date header in the report, not a true multi-line invoice.
- Pricing: fixed per product, or variable (discounts/negotiated price) per sale? **Answered:** variable per sale — Price is a free-entry field on both the Sell Entry and Purchase Items forms (with +/− steppers), not pulled automatically from a fixed product price list.
- ~~Does the app need to track payment mode (cash/UPI/credit) or customer info per sale?~~ **Answered (current app):** no payment mode or customer field exists today. Still open: does the NEW app need to add this, or keep parity with the old system?
- Definition of "cycle" for the backup button (daily/weekly/monthly/other)? **Still open.** Observation from data: purchases happen in irregular, infrequent large batches (5 times across ~13 months), while sales happen daily in small amounts — suggests "cycle" may naturally align with purchase/restock events rather than a fixed calendar period, but needs user confirmation.

---

## 7. Existing AppSheet App — Screenshot Analysis (Aug 15, 2026)

App name in AppSheet: **MsinventoryAppSheet**. Analyzed 17 screenshots (`/ss` folder) covering every screen/state.

### Navigation
- **Side menu:** Sales, Purchase, Products, Purchase Report, Sales Report, Sale Comparison, Purchase Comparison (plus AppSheet boilerplate: About, Add Shortcut, App Gallery).
- **Bottom tab bar** (persistent): Sales | Purchase | Products.

### Screens & Behavior

**Products** (master data)
- List view: Product Name, Product ID, Creation date. Delete/Edit icons per row, "+" FAB to add.
- Add/Edit form fields: `Product ID`, `Product Name`, `Creation On` (date), `Created At` (time, auto-stamped).
- Detail view per product shows **Related Sales** (count + table: ID, PID, Quantity, Price) and **Related Purchases** (count + table: ID, PID, Quantity), each with View/Add shortcuts into new entries.
- No stock-on-hand, category, or supplier field.

**Sales** ("Sell Entry" form + "Sales." list)
- List grouped by date with a per-day ₹ total; line items underneath (product, qty, unit price) with Delete/Edit/View-detail actions.
- Sell Entry form: ID (auto), Product (dropdown), Quantity (+/− stepper), Price (+/− stepper, free entry), Date, Time (auto-filled), TotalPrice (auto-computed, read-only).
- One product per entry — no cart/multi-line invoice.

**Purchase** ("Purchase Items" form + "Purchase." list)
- Same structure as Sales: list grouped by date with per-day total; line items with product/qty/price.
- Purchase Items form: ID (auto), PID (dropdown), Quantity, Price, Date, Time, TotalPrice (auto-computed).

**Sales Report / Purchase Report**
- Each has two drill-down views: **Date** grouping (All + per-date totals, chevron to drill in) and **Quantity** grouping (same rows pivoted by ID/Product/Quantity).
- Header has Search, multi-select (bulk actions), bulk-edit, and refresh icons.
- Purchase totals per date are much larger (₹10K–₹48K) than sales per date (₹200–₹3.5K) — consistent with infrequent bulk restocking vs. frequent small retail sales.

**Sale Comparison / Purchase Comparison**
- Horizontal bar charts, SUM(Price) by Date.
- Sale Comparison spans ~18 months of near-daily dates (Mar 2025 → Aug 2026).
- Purchase Comparison shows only 5 data points total (1/7/2025, 26/12/2025, 27/12/2025, 19/4/2026, 2/8/2026) — confirms purchases are rare, large restocking events rather than routine.

### Data Model Implied by the Screens (for new SQLite schema)
- **Products:** `product_id`, `product_name`, `created_on`, `created_at`.
- **Sales:** `id`, `product_id` (FK), `quantity`, `price` (unit), `date`, `time`, `total_price` (= qty × price).
- **Purchases:** same shape as Sales — `id`, `product_id` (FK), `quantity`, `price`, `date`, `time`, `total_price`.
- No customer, supplier, payment-mode, or category tables/fields anywhere in the current app.
- Product names (e.g. "Ace Shackle Patti," "250 ML. Brake Oil (TVS)," "Honda Looking Glass," "1 Ltr CRB Esential") confirm this is a **two/three-wheeler auto-parts & lubricants retail shop**.

---

## 8. What Happens Next (When Resuming in a New Session)

1. Share this reference doc at the start of the new chat.
2. ~~Share the AppSheet screenshots~~ — done (Section 7). Still need: Google Sheet CSV samples, once user has access.
3. From there, the next steps will be:
   - Finalize SQLite schema (Products, Sales, Purchases, and any other entities)
   - Design new UI/screen list and navigation flow
   - Plan Google Sheets API auth approach for Expo (for backup + migration)
   - Build the "Import from Sheet" migration flow
   - Build the "Close Cycle" backup flow
   - Set up Expo project structure and begin implementation

---

*End of reference doc.*
