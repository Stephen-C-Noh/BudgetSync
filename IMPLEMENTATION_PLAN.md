# BudgetSync — Implementation Plan

Recommended order: 4 → 3 → 7 → 1 → 2 → 5 → 9a → 9b → 9c → 8 (search+options) → 6 → 8★

---

## 1. Add Budget Goal
**File:** `app/budget-goals.tsx`  
**Approach:** Inline React Native `Modal`.
- State: `modalVisible`, `goalCategoryId`, `goalAmountStr`, `goalPeriod: "weekly"|"monthly"|"yearly"`
- Category picker: expense-only, exclude already-assigned categories
- Save: `addBudgetGoal({ id: Crypto.randomUUID(), category_id, limit_amount: parseFloat(goalAmountStr), period, created_at })`

---

## 2. Add Custom Category + Edit Category (pencil icon)
**Files:** `lib/db.ts`, `context/AppContext.tsx`, `app/category-settings.tsx`

**New data layer:**
- `lib/db.ts`: add `updateCategory(id, name, icon)` — `UPDATE categories SET name=?, icon=? WHERE id=?`
- `context/AppContext.tsx`: add `updateCategory(category: Category)` action

**Shared inline Modal:**
- State: `modalVisible`, `editingCat: Category | null` (null = add), `nameInput`, `iconInput`
- Add: `addCategory({ id: Crypto.randomUUID(), name, icon, type: activeTab, is_custom: 1 })`
- Edit: `updateCategory({ ...editingCat, name, icon })`

---

## 3. Date Picker in Add Transaction
**File:** `app/add-transaction.tsx`  
**New dependency:** `expo install @react-native-community/datetimepicker`
- Convert hardcoded `today` to `useState<string>`
- DATE field row becomes `TouchableOpacity` → shows native picker
- iOS: picker inside a `Modal`; Android: native dialog

---

## 4. Add Transaction Button in Calendar View
**File:** `components/shared/CalendarView.tsx`
- Add `useRouter` import
- When `selected !== null`, render "+ Add Transaction" button below the day detail section
- `onPress` → `router.push({ pathname: "/add-transaction", params: { date: selected } })`

---

## 5. Currency & Language Settings
**Files:** `app/settings.tsx`, `context/AppContext.tsx`
- Add `onPress` prop to `MenuRow` component in settings.tsx
- Import `useAppActions` in settings.tsx

**Currency modal:** list of common codes (USD, EUR, GBP, JPY, KRW, CAD, AUD…)
- Save: `updateUserProfile({ ...userProfile, currency })` + `updateSetting("currency", value)`

**Language modal:** list (EN-US, KO-KR, JA-JP, ZH-CN, FR-FR, ES-ES, DE-DE)
- Save: `updateUserProfile({ ...userProfile, language })`

---

## 6. Neural Budget Alerts & Weekly Sync Digest
**Files:** `lib/db.ts`, `context/AppContext.tsx`, `app/settings.tsx`  
**New dependency:** `expo install expo-notifications`
- Persist toggles via settings table keys `budget_alerts` and `weekly_digest`
- **Budget Alerts:** after `addTransaction`, check if any goal hits ≥80% spend → schedule local push notification if enabled; request permissions on first enable
- **Weekly Digest:** on app foreground, check `weekly_digest` + `last_digest_at` setting; if a week has passed, compute weekly summary and schedule notification

---

## 7. Change Password
**Files:** `app/settings.tsx`, `lib/supabase.ts`
- Add `changePassword(newPassword: string)` helper to `lib/supabase.ts` using `supabase.auth.updateUser({ password })`
- Inline Modal in settings.tsx: New Password + Confirm Password inputs (secureTextEntry + eye toggle)
- Validate: non-empty, ≥8 chars, passwords match
- If no sync session active, show Alert to connect sync first

---

## 8. Header Icons — Search & Options
**Files:** `app/(tabs)/index.tsx`, `app/(tabs)/accounts.tsx`
- **Search:** wrap icon in `TouchableOpacity`; toggle `TextInput` bar below header; filter transactions before passing to child views
- **Options:** wrap icon in `TouchableOpacity`; small Modal with sort (Newest/Oldest/Amount↑/Amount↓) and type filter (All/Income/Expense)

---

## 8★. Header Icon — Star Filter *(schema change required)*
**Files:** `lib/db.ts`, `context/AppContext.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/accounts.tsx`, `components/shared/TxRow.tsx`
- Add `starred INTEGER DEFAULT 0` to transactions table + `ALTER TABLE` migration for existing installs
- Add `updateTransaction` to db.ts and AppContext
- Star icon toggles `showStarred` filter; `TxRow` gets tap-to-star action

---

## 9. Stats Screen Improvements
**File:** `app/(tabs)/stats.tsx`

### 9a. Overview Tab — Net Cashflow Layout
**Current state:** Overview tab renders the same donut/breakdown as Expenses/Income, mixing all transaction types together with no meaningful summary.  
**Plan:**
- Give Overview its own layout: a large net cashflow figure (`totalIncome - totalExpense`) with a +/- color indicator
- Side-by-side Income vs Expense tiles (same style as Monthly view)
- A combined bar chart showing income and expense bars side-by-side for each week
- No donut chart in Overview — replace with the income/expense comparison

### 9b. Multi-Segment Donut Chart
**Current state:** Donut shows only the top category's share as a single arc; all other categories appear only in the legend.  
**Plan:**
- Replace single-arc donut with a multi-segment donut drawn via `react-native-svg`
- Each `breakdown` entry becomes one `Circle` arc, offset by cumulative `strokeDashoffset`
- Center label changes to show total amount instead of top category name
- Tap a legend row to highlight that segment and show its percentage in the center

### 9c. Expandable Month Range
**Current state:** Month chips are hardcoded to the last 3 months (`getRecentMonths(3)`); no way to view earlier months.  
**Plan:**
- Replace hardcoded chip list with a left/right `NavRow`-style month navigator, or extend `getRecentMonths` to 12 and make the chip row horizontally scrollable (`ScrollView horizontal`)
- Keep the current 3-chip quick-select visible by default; add a "…" chip at the end that expands to show all 12

---

## Complexity Summary

| # | Feature | Complexity | Schema change | New dependency |
|---|---|---|---|---|
| 1 | Add Budget Goal | Low | No | No |
| 2 | Add/Edit Category | Medium | No | No |
| 3 | Date Picker | Low | No | `datetimepicker` |
| 4 | Add Tx in Calendar | Low | No | No |
| 5 | Currency & Language | Medium | No | No |
| 6 | Budget Alerts & Digest | High | No | `expo-notifications` |
| 7 | Change Password | Low | No | No |
| 8 | Search + Options | Medium | No | No |
| 8★ | Star Filter | High | Yes | No |
| 9a | Stats: Overview tab | Medium | No | No |
| 9b | Stats: Multi-segment donut | Medium | No | No |
| 9c | Stats: Expandable month range | Low | No | No |

---

## Completed
- `app/about.tsx` — About screen with app info, tech stack, developer credits
- `app/(tabs)/more.tsx` — About wired, Help & Support and Feedback disabled
