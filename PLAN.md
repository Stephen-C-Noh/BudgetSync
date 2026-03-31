# BudgetSync Development Plan

## Context

The project has its architectural decisions locked in (ADR-001 through ADR-008) and its dependencies partially installed. No application screens exist yet beyond a placeholder. This plan covers full implementation from the navigation shell through every screen visible in the reference mockups.

---

## Design System (Do First — Everything Depends on This)

Establish a shared theme file before building any screen.

**`constants/theme.ts`**

- Background: `#0D1117` (near-black)
- Card surface: `#161B22`
- Accent / primary: `#00D4FF` (teal/cyan)
- Income green: `#00C853`
- Expense red: `#FF3B30`
- Text primary: `#FFFFFF`
- Text secondary: `#8B949E`
- Font sizes, border radii, spacing scale

All components pull from this file — never hardcode colours inline.

---

## Phase 1 — Foundation

### 1.1 Install missing dependencies

```bash
npx expo install expo-sqlite expo-secure-store expo-local-authentication
npm install @supabase/supabase-js react-native-chart-kit react-native-svg
```

### 1.2 SQLite schema

File: `lib/db.ts`

Tables:

```sql
accounts      (id, name, type, last4, balance, currency, created_at)
categories    (id, name, type, icon, is_custom)
transactions  (id, account_id, category_id, type, amount, note, date, created_at, synced)
budget_goals  (id, category_id, limit_amount, period, created_at)
user_profile  (id, name, email, currency, language)
settings      (key, value)
```

Seed default categories on first launch:

- Expense: Groceries, Dining, Shopping, Transport, Rent, Entertainment, Utilities
- Income: Salary, Investment, Bonus, Freelance

### 1.3 React Context

File: `context/AppContext.tsx`

Holds in-memory cache of: `transactions[]`, `accounts[]`, `categories[]`, `budgetGoals[]`, `userProfile`, `settings`.

Provides actions: `addTransaction`, `deleteTransaction`, `addAccount`, `updateSettings`, etc.

On app start: load all SQLite data → hydrate context. On every write: write SQLite first → update context.

### 1.4 Navigation shell

File: `app/_layout.tsx` — wraps the whole app in `<AppProvider>` and handles biometric gate on launch.

File: `app/(tabs)/_layout.tsx` — 5-tab bottom navigator:

| Tab      | Icon                                | Screen                    |
| -------- | ----------------------------------- | ------------------------- |
| Today    | calendar (shows current day number) | `app/(tabs)/index.tsx`    |
| Stats    | bar chart                           | `app/(tabs)/stats.tsx`    |
| AI Chat  | chat bubble                         | `app/(tabs)/ai-chat.tsx`  |
| Accounts | wallet                              | `app/(tabs)/accounts.tsx` |
| More     | ellipsis                            | `app/(tabs)/more.tsx`     |

Sub-screens accessed via stack navigation from More:

- `app/settings.tsx`
- `app/category-settings.tsx`
- `app/budget-goals.tsx`
- `app/add-transaction.tsx` (pushed from Today's "+ Add Transaction" button)

---

## Phase 2 — Today Screen (`app/(tabs)/index.tsx`)

**What the mockup shows:**

- Top bar: current date (e.g. "02-20"), search, star, filter icons
- Year navigation with left/right arrows
- View mode tabs: Daily | Calendar | **Monthly** | Summary | Description
- Teal gradient card: Total Balance + linked card (last4 + brand)
- Two summary tiles: Income (with % change) | Expenses (with % change)
- "Quick Actions" → full-width "+ Add Transaction" teal button
- "Recent Transactions" list (icon, name, time, amount, category) + "See All"
- Bottom tab bar

**Implementation notes:**

- Default view: Monthly
- Balance / income / expense totals computed from Context filtered by selected month/year
- Tapping a transaction row → detail view (simple modal or stack screen)
- "See All" → filtered transaction list screen
- "+ Add Transaction" → navigate to `app/add-transaction.tsx`

---

## Phase 3 — Add Transaction Screen (`app/add-transaction.tsx`)

**What the mockup shows (two states — Expense / Income toggle):**

- Back arrow + "Add Transaction" title
- Expense | Income toggle (teal highlight on active)
- Large amount input: "$ 0.00" in teal (tap to open numeric keypad)
- Category picker: pill chips (Food & Dining, Shopping, Transport, Rent, +) — loaded from Context; "See All" link
- Date picker: defaults to today, tappable to change
- Account/Payment Method picker: shows account name + last4
- Optional note text field
- "Save Transaction →" teal CTA button
- "BACK" text link

**Income vs Expense differences:**

- Category list switches between income and expense categories
- Label on account row says "PAYMENT METHOD" for expense, "ACCOUNT" for income

**Implementation notes:**

- Amount entry: large teal numeric display; tapping focuses a hidden `TextInput` or opens a custom numpad
- On save: write to SQLite `transactions` table → update Context → pop screen

---

## Phase 4 — Stats Screen (`app/(tabs)/stats.tsx`)

**What the mockup shows:**

- Header: "Stats"
- Tabs: Overview | **Expenses** | Income
- Horizontal month scroll: current month as dropdown, past months as pills
- Summary tiles: Total Spending (with % vs last month) | Monthly Budget (with progress bar)
- "Spending Breakdown" donut chart (react-native-chart-kit `PieChart`)
  - Center label: "TOP CATEGORY — Housing"
  - Legend list below: category name + amount
- "Weekly Trends" bar chart (react-native-chart-kit `BarChart`) — W1 through W4

**Implementation notes:**

- Data computed from Context filtered by selected tab (expense/income) and selected month
- Budget progress bar = total spending / budget goal limit for the month
- If no budget goal set, show "Set Budget" CTA instead of progress bar

---

## Phase 5 — Accounts Screen (`app/(tabs)/accounts.tsx`)

**What the mockup shows:**

- Header: "Accounts" with search, star, filter icons
- Same year navigation + view tabs as Today screen (shared component)
- Teal gradient card: Net Worth + "5 Active Accounts" + "Updated Today"
- Two summary tiles: Assets (Total Value, green) | Liabilities (Total Debt, red)
- "Account Breakdown" list:
  - Cash & Bank (balance, type label, status badge)
  - Investments (balance, sub-type label, % change)
  - Credit Cards (balance in red, brands label, due date)

**Implementation notes:**

- Net Worth = sum of all account balances (assets minus liabilities)
- Each row tappable → account detail (transactions filtered by account)
- "+" FAB or header button to add a new account

---

## Phase 6 — More Screen & Sub-Screens

### More Screen (`app/(tabs)/more.tsx`)

**What the mockup shows:**

- User profile card: avatar, name, email
- PREFERENCES: Settings →, Category Settings →, Budget Goals →
- PRIVACY & SECURITY: Security (Biometrics) toggle
- RESOURCES: Help & Support →, Feedback →, About →

### Settings Screen (`app/settings.tsx`)

**What the mockup shows:**

- IDENTITY: avatar (editable), full name, email
- LOCALIZATION: Primary Currency (picker), System Language (picker)
- ALERTS: Neural Budget Alerts toggle (notify at 80% threshold), Weekly Sync Digest toggle
- SECURITY: Change Password button, Delete Account button (destructive red)

### Category Settings (`app/category-settings.tsx`)

- List of all categories with edit/delete
- Add custom category (name + icon picker)

### Budget Goals (`app/budget-goals.tsx`)

- List of budget goals per category with monthly limit
- Add/edit/delete goals

**Budget Goals input UX:** Instead of typing a number, the user drags segments of an interactive pie chart to allocate their total monthly budget across categories. Each slice represents a category; dragging its edge grows/shrinks the allocation and updates the displayed dollar amount in real time. A remaining/unallocated slice (grey) fills any unused budget. Tapping a slice labels it with the category name and current amount.

- Use `react-native-svg` (already in the dependency list) to render the interactive pie
- Track drag angle via `PanResponder` and convert to percentage → dollar amount
- Write the final amounts to `budget_goals` in SQLite on confirm

---

## Phase 7 — Biometric Authentication

**Flow:**

1. On app launch, before showing any screen, check `settings` table for `biometrics_enabled`
2. If enabled: call `expo-local-authentication` → show biometric prompt
3. If biometrics fail or unavailable: show PIN fallback screen
4. If disabled: go straight to Today tab

**Files:**

- `app/auth.tsx` — biometric/PIN gate screen
- `lib/auth.ts` — wrapper around `expo-local-authentication`

The toggle in the More screen writes `biometrics_enabled` to SQLite settings and updates Context. Toggling on immediately prompts biometric enrollment confirmation.

---

## Phase 8 — AI Chat Screen (`app/(tabs)/ai-chat.tsx`)

**What the mockup shows:**

- Header: "SyncBot AI" + green "ONLINE ASSISTANT" dot + info icon
- Chat message list (SyncBot bubbles left, user bubbles right in teal)
- SyncBot can attach action button chips below its response ("Show breakdown", "Adjust budget", "Compare to last month")
- Input bar: "+" attachment icon, text field "Ask about your budget...", mic icon, send button (teal arrow)
- Disclaimer: "AI CAN MAKE MISTAKES. CHECK YOUR STATEMENTS FOR ACCURACY."

**BYOK Onboarding flow (first launch of this tab):**

1. If no API key in `expo-secure-store`: show inline prompt asking user to enter their Gemini API key with a link to Google AI Studio
2. Validate key with a lightweight test call
3. On success: store key → load chat

**Gemini API integration (`lib/gemini.ts`):**

- Retrieve key from `expo-secure-store` at call time (never cache in memory)
- Build context payload: pull last 30 days of transactions from Context, compute totals by category
- Attach financial summary to system prompt alongside user message
- Parse response text → display as SyncBot message
- Action chips are parsed from structured response hints (or hardcoded suggestions)

---

## Phase 9 — Supabase Sync (Last)

**Why last:** All core features work fully offline. Sync is an enhancement.

**Schema:** Mirror SQLite tables in Supabase (Postgres). Each row has a `synced` boolean and `updated_at` timestamp.

**Sync logic (`lib/sync.ts`):**

- On app foreground (network available): push all rows where `synced = false`
- On first login on a new device: pull all rows from Supabase → seed local SQLite

**Auth:** Supabase email/password auth maps to the user profile (the email shown in Settings and More screens).

---

## Build Order Summary

| Phase         | Deliverable                                             |
| ------------- | ------------------------------------------------------- |
| Design System | `constants/theme.ts`                                    |
| 1             | Dependencies, SQLite schema, Context, Navigation shell  |
| 2             | Today screen (home)                                     |
| 3             | Add Transaction screen                                  |
| 4             | Stats screen with charts                                |
| 5             | Accounts screen                                         |
| 6             | More, Settings, Category Settings, Budget Goals screens |
| 7             | Biometric auth gate                                     |
| 8             | AI Chat + Gemini BYOK                                   |
| 9             | Supabase cloud sync                                     |

Each phase produces runnable, testable screens before the next begins.

---

## Verification Approach

- Run `npm start` and test on Android emulator after each phase
- Phase 1: confirm Context hydrates from SQLite with seeded categories/accounts
- Phase 2–6: visual comparison against reference mockups in `referenceImg/`
- Phase 7: test biometric toggle in More → force-close and relaunch
- Phase 8: enter a real Gemini API key → send a question → verify financial context is injected
- Phase 9: add a transaction offline → connect to network → confirm row appears in Supabase dashboard
