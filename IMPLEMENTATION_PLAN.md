# BudgetSync — Implementation Plan

Items are ordered by dependency and priority. Complete each phase before starting the next.

---

## Phase 1 — Core Data CRUD (fix broken user flows)

### 1. Edit & Delete Transaction
**Files:** `lib/db.ts`, `context/AppContext.tsx`, `components/shared/TxRow.tsx`

**Data layer:**
- `lib/db.ts`: add `updateTransaction(tx: Transaction)` — parameterized `UPDATE transactions SET account_id=?, category_id=?, type=?, amount=?, note=?, date=? WHERE id=?`
- Balance correction must run inside a **SQLite transaction block**: reverse the old amount effect on the account, then apply the new amount — both must succeed or both roll back
- `context/AppContext.tsx`: add `updateTransaction(tx: Transaction)` action

**UI:**
- Tap a `TxRow` → open a bottom-sheet edit modal (same fields as add-transaction: type toggle, amount, category, date, note)
- Pre-populate all fields from the existing transaction
- Long-press or swipe → reveal Delete; confirm with `Alert` showing the transaction amount and category so the user knows exactly what will be removed
- Validate: amount > 0, category selected, date is a valid YYYY-MM-DD string

**Security & quality:**
- All SQL uses `?` placeholders — never string interpolation
- Balance reversal and re-application are atomic (SQLite `BEGIN`/`COMMIT`)
- Amount parsed with `parseFloat`; guard `isNaN` before any arithmetic

---

### 2. Add Transaction Button in Calendar View
**File:** `components/shared/CalendarView.tsx`
- Add `useRouter` import
- When `selected !== null`, render a "+ Add Transaction" button below the day detail section
- `onPress` → `router.push({ pathname: "/add-transaction", params: { date: selected } })`

---

### 3. Date Picker in Add Transaction
**File:** `app/add-transaction.tsx`
**New dependency:** `expo install @react-native-community/datetimepicker`
- Convert hardcoded `today` constant to `useState<string>` initialized from `dateParam ?? today`
- DATE field row becomes a `TouchableOpacity` that shows the native picker
- iOS: render picker inside a `Modal`; Android: picker appears as native dialog
- Clamp selectable range to reasonable bounds (e.g., year 2000 – today + 1 year) to prevent obviously invalid dates

---

### 4. Edit & Delete Financial Account
**Files:** `lib/db.ts`, `context/AppContext.tsx`, `components/accounts/MonthlyView.tsx`

**Data layer:**
- `lib/db.ts`: add `updateAccount(account: Account)` — parameterized `UPDATE accounts SET name=?, type=?, balance=?, last4=?, currency=? WHERE id=?`
- `lib/db.ts`: add `deleteAccount(id: string)` — `DELETE FROM accounts WHERE id=?`
- `context/AppContext.tsx`: add `updateAccount` and `deleteAccount` actions

**UI:**
- Tap an account card in MonthlyView → open an edit bottom-sheet (same fields as Add Account: name, type, balance, last4)
- Delete option inside the edit sheet; confirm with `Alert` that warns: *"Deleting this account will not delete its transactions. They will remain unlinked."*
- Balance field in edit mode represents a manual balance correction, not a transaction entry

**Security & quality:**
- `deleteAccount` does **not** cascade-delete transactions — transactions remain in DB with their `account_id` intact (orphan-safe; they still appear in totals)
- `last4` must match `/^\d{4}$/` or be empty — validate before save
- Type change (e.g., bank → credit_card) recalculates net worth immediately via existing `useMemo` in MonthlyView

---

### 5. Add Custom Category + Edit Category
**Files:** `lib/db.ts`, `context/AppContext.tsx`, `app/category-settings.tsx`

**Data layer:**
- `lib/db.ts`: add `updateCategory(id, name, icon)` — `UPDATE categories SET name=?, icon=? WHERE id=?`
- `context/AppContext.tsx`: add `updateCategory(category: Category)` action

**Shared inline Modal (add and edit modes):**
- State: `modalVisible`, `editingCat: Category | null` (null = add mode), `nameInput`, `iconInput`
- Add: `addCategory({ id: Crypto.randomUUID(), name, icon, type: activeTab, is_custom: 1 })`
- Edit: `updateCategory({ ...editingCat, name, icon })`
- Prevent editing the `type` field in edit mode — changing a category's type would silently corrupt existing transactions

**Security & quality:**
- Trim `name` input; reject empty string
- `icon` field accepts any single emoji character; no HTML/script injection risk in React Native but still trim whitespace
- Only `is_custom: 1` categories can be edited or deleted — guard against modifying built-in categories in both UI (hide pencil/trash) and in the action handler

---

### 6. Add Budget Goal
**File:** `app/budget-goals.tsx`
**Approach:** Inline React Native `Modal`
- State: `modalVisible`, `goalCategoryId`, `goalAmountStr`, `goalPeriod: "weekly"|"monthly"|"yearly"`
- Category picker: expense-type only; exclude categories that already have a goal for the same period
- Save: `addBudgetGoal({ id: Crypto.randomUUID(), category_id, limit_amount: parseFloat(goalAmountStr), period, created_at: new Date().toISOString() })`

**Security & quality:**
- Guard `parseFloat` result with `isNaN` and `> 0` check before saving
- Deduplication check (same category + same period) must happen in the UI filter, not silently overwrite in the DB

---

## Phase 2 — User Account Management

### 7. Edit User Profile (name)
**Files:** `app/settings.tsx`, `app/(tabs)/more.tsx`
- The pencil badge on the avatar in both screens is currently a no-op; wire it to an inline `Modal`
- Form: single `TextInput` for full name (email is not editable — email changes require Supabase re-verification, which is out of scope)
- Save: `updateUserProfile({ ...userProfile, name: trimmedName })`

**Security & quality:**
- Trim whitespace; reject empty string
- Do not allow email editing here — changing email via `supabase.auth.updateUser({ email })` sends a confirmation link and is a multi-step async flow; surface it as a separate future feature
- Show current name as placeholder so the user sees what they're changing

---

### 8. Change Password
**Files:** `app/settings.tsx`, `lib/supabase.ts`
- Add `changePassword(newPassword: string)` helper to `lib/supabase.ts` using `supabase.auth.updateUser({ password: newPassword })`
- Inline `Modal` in settings.tsx: New Password + Confirm Password `TextInput`s, both `secureTextEntry`, each with an eye-toggle icon
- If no sync session is active, show `Alert` directing user to connect sync first (password lives in Supabase auth, not locally)

**Security & quality:**
- Minimum 8 characters; enforce before calling Supabase
- Passwords must match before the API call is made
- Never log or store the password string — pass directly to `supabase.auth.updateUser` and discard
- Rate limiting is handled server-side by Supabase; no client-side throttle needed
- Clear the input fields on modal close regardless of success or failure

---

### 9. Delete User Account
**File:** `app/settings.tsx`
- The red "Delete Account" button is currently a no-op

**Two-step confirmation:**
1. First `Alert`: *"This will permanently delete all your local data and sign you out. This cannot be undone."*
2. Second confirmation: require the user to type `"DELETE"` into a `TextInput` before the confirm button activates — prevents accidental taps

**Deletion sequence (order matters):**
1. Call `supabase.auth.deleteUser()` (if sync connected) — revoke server session first
2. Drop and recreate all local SQLite tables (or `DELETE FROM` each table in a transaction)
3. Clear all `SecureStore` keys: PIN, biometrics flag, Gemini API key
4. Clear all in-memory app state via a context reset
5. Navigate to `/auth`

**Security & quality:**
- If Supabase deletion fails (e.g., offline), still proceed with local wipe — user can re-authenticate and delete server data later
- Do not delete the SQLite file itself; DROP/recreate tables so the DB file structure remains intact for a fresh start
- Wrap all SQLite deletes in a single transaction block

---

## Phase 3 — Financial Features

### 10. Currency & Language Settings
**Files:** `app/settings.tsx`, `context/AppContext.tsx`
- Add `onPress` prop to the `MenuRow` component in settings.tsx; import `useAppActions`

**Currency modal:** scrollable list of common currency codes (USD, EUR, GBP, JPY, KRW, CAD, AUD, SGD, HKD, CNY)
- Save: `updateUserProfile({ ...userProfile, currency })` + `updateSetting("currency", value)`
- Note: changing currency is a display-only change — existing balances and amounts in the DB are not converted

**Language modal:** list (EN-US, KO-KR, JA-JP, ZH-CN, FR-FR, ES-ES, DE-DE)
- Save: `updateUserProfile({ ...userProfile, language })`
- Note: language change affects display labels only; full i18n is out of scope

**Security & quality:**
- Currency code must be from a fixed allowlist — do not accept free-text input
- Language code must be from a fixed allowlist for the same reason

---

### 11. Transfer between Financial Accounts
**Files:** `lib/db.ts`, `context/AppContext.tsx`, new `app/transfer.tsx` route

**Approach:** Dedicated route `/transfer` (not a modal — transfers have enough fields to warrant a full screen)
- Fields: From account (picker), To account (picker), Amount, Date, Note (optional)
- Creates **two linked transactions** atomically:
  - Debit: `type: "expense"` on the source account with a system category "Transfer Out"
  - Credit: `type: "income"` on the destination account with a system category "Transfer In"
  - Both share a `transfer_id` (UUID) to link them — requires adding `transfer_id TEXT` column to transactions table

**Security & quality:**
- Both inserts and both balance updates must run inside a **single SQLite transaction block** — if either fails, the entire operation rolls back
- Validate: From ≠ To account; Amount > 0
- For non-credit source accounts, warn (but don't block) if amount exceeds current balance
- The "Transfer In/Out" system categories should be seeded in `initDb` and excluded from budget goal pickers and Stats breakdown

---

### 12. CSV Export
**Files:** `app/settings.tsx` or a new export button in the More screen
**New dependency:** `expo install expo-sharing expo-file-system`

- Generate a CSV string from the transactions array: `Date, Type, Amount, Category, Account, Note`
- Use human-readable names (category name, account name) — not raw UUIDs
- Write to a temp file via `expo-file-system`, then share via `expo-sharing`
- Allow filtering by date range (month picker) before export

**Security & quality:**
- Export only data belonging to the local user — no cross-user data risk since the app is single-user local
- Do not include internal IDs (UUIDs) in the CSV output
- Temp file is written to `FileSystem.cacheDirectory` — OS handles cleanup; do not write to a publicly accessible path

---

### 13. Recurring Transactions
**Files:** `lib/db.ts`, `context/AppContext.tsx`, new `app/recurring.tsx`, `app/_layout.tsx`

**Schema:** new `recurring_transactions` table:
```
id TEXT PRIMARY KEY
account_id TEXT
category_id TEXT
type TEXT
amount REAL
note TEXT
frequency TEXT  -- "daily" | "weekly" | "monthly" | "yearly"
next_due_date TEXT  -- YYYY-MM-DD
created_at TEXT
```

**Logic:** On app foreground (`AppState` listener in `_layout.tsx`), query for recurring transactions where `next_due_date <= today`; for each, insert the transaction and advance `next_due_date` — all inside a SQLite transaction block

**Security & quality:**
- Due-date check runs on foreground, not on a background timer (Expo background execution is unreliable)
- Advancing `next_due_date` and inserting the transaction must be atomic
- Cap max advance to 1 period at a time — if the app hasn't been opened for 3 months, insert only the most recent occurrence and update `next_due_date` to the next upcoming date

---

## Phase 4 — UX Polish

### 14. Empty State CTAs
**Files:** `components/shared/DailyView.tsx`, `components/shared/CalendarView.tsx`, `components/accounts/MonthlyView.tsx`, `app/budget-goals.tsx`, `app/category-settings.tsx`

Replace plain "No data" text in empty states with actionable prompts:
- Empty transaction list → "+ Add Transaction" button (routes to `/add-transaction`)
- Empty account list → "+ Add Account" button (opens Add Account modal)
- Empty budget goals → "+ Add Budget Goal" button (opens Add Goal modal)
- Empty categories → "+ Add Category" button (opens Add Category modal)

**Quality:** CTAs must match the same navigation/modal pattern used in the non-empty state so there are no two different code paths for the same action.

---

### 15. Onboarding Flow
**Files:** new `app/onboarding.tsx`, `app/_layout.tsx`, `lib/db.ts`

**Trigger:** On app start, check `settings` table for `onboarding_complete = "1"`; if absent, redirect to `/onboarding` before showing the tab navigator.

**3-step flow:**
1. **Welcome** — app name, tagline, "Get Started" button
2. **Set your name** — `TextInput` for name; saves via `updateUserProfile`
3. **Add your first financial account** — reuse the Add Account form fields inline

**After completion:** write `updateSetting("onboarding_complete", "1")`, navigate to main tabs.

**Quality:**
- Onboarding is skippable at step 2 and 3 (user can complete it later)
- Never show onboarding again once `onboarding_complete` is set, even after app restart
- Do not gate onboarding behind sync/auth — it must work fully offline

---

### 16. Header Icons — Search & Options
**Files:** `app/(tabs)/index.tsx`, `app/(tabs)/accounts.tsx`

**Search:**
- Wrap `search-outline` icon in `TouchableOpacity`
- Toggle a `TextInput` bar below the header (animate height with `Animated.Value` or simple conditional render)
- Filter `transactions` by note/amount/category name match before passing to child view components
- Debounce the filter by 150ms to avoid per-keystroke re-renders on large transaction lists

**Options:**
- Wrap `options-outline` icon in `TouchableOpacity`
- Small `Modal` with: sort order (Newest / Oldest / Amount ↑ / Amount ↓) and type filter (All / Income / Expense only)
- Apply sort and filter to transactions before passing to child views

**Quality:**
- Search filter is case-insensitive (`toLowerCase()` on both sides)
- Sort and filter state resets when the user switches tabs (Daily/Calendar/Monthly/Summary)

---

### 17. Header Icon — Star Filter *(schema change required)*
**Files:** `lib/db.ts`, `context/AppContext.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/accounts.tsx`, `components/shared/TxRow.tsx`

**Schema migration:**
- `ALTER TABLE transactions ADD COLUMN starred INTEGER DEFAULT 0`
- Wrap in try/catch — SQLite throws if the column already exists (idempotent migration)

**Implementation:**
- `updateTransaction` (introduced in item 1) handles the star toggle — no new DB function needed
- `TxRow` gets a star icon tap that calls `updateTransaction({ ...tx, starred: tx.starred ? 0 : 1 })`
- Star icon in header toggles `showStarred` state; when active, filter transactions to `tx.starred === 1`

---

## Phase 5 — Stats Screen

### 18a. Stats: Overview Tab — Net Cashflow Layout
**File:** `app/(tabs)/stats.tsx`

**Current issue:** Overview shows all transactions mixed with the same donut/breakdown as Expenses/Income — no meaningful summary.

**Plan:**
- Give Overview its own layout branch: large net cashflow figure (`totalIncome − totalExpense`) with green/red color
- Side-by-side Income vs Expense tiles
- Combined weekly bar chart: two bars per week (income = green, expense = cyan)
- Remove donut from the Overview branch entirely

---

### 18b. Stats: Multi-Segment Donut Chart
**File:** `app/(tabs)/stats.tsx`

**Current issue:** Single arc shows only the top category's share; all others only appear in the legend.

**Plan:**
- Replace with a full multi-segment donut using `react-native-svg` (already a dependency)
- Each `breakdown` entry → one `Circle` arc, positioned by cumulative `strokeDashoffset`
- Center label shows total amount; tapping a legend row highlights that segment and shows its percentage in the center

**Quality:** Cap rendered segments at 6; group the rest into "Other" to avoid rendering too many tiny arcs.

---

### 18c. Stats: Expandable Month Range
**File:** `app/(tabs)/stats.tsx`

**Current issue:** Month chips hardcoded to last 3 months with no way to go further back.

**Plan:**
- Extend `getRecentMonths` to 12 and render inside a horizontal `ScrollView`
- Default scroll position shows the most recent 3 months; older months are accessible by scrolling left

---

## Phase 6 — Advanced Features

### 19. Neural Budget Alerts & Weekly Sync Digest
**Files:** `lib/db.ts`, `context/AppContext.tsx`, `app/settings.tsx`
**New dependency:** `expo install expo-notifications`

- Persist toggle state in the settings table (`budget_alerts`, `weekly_digest`, `last_digest_at`)
- **Budget Alerts:** after `addTransaction`, check if any monthly goal now has spend ≥ 80% of its limit; if so and alerts are enabled, schedule a local push notification
- **Weekly Digest:** on app foreground, check if `weekly_digest` is enabled and a week has elapsed since `last_digest_at`; if so, compute income/expense summary and schedule a notification

**Security & quality:**
- Call `Notifications.requestPermissionsAsync()` only on first toggle-on — check existing permission status first
- If permission is denied, show an `Alert` directing the user to system settings (`Linking.openSettings()`) instead of re-requesting
- Store `last_digest_at` as an ISO timestamp in the settings table — never derive schedule from in-memory state
- Notification payload must not include raw amounts if the device has no lock screen (digest is acceptable; goal names are fine)

---

### 20. AI Chat Context Injection
**File:** `app/(tabs)/ai-chat.tsx`

**Current issue:** Gemini chat has no knowledge of the user's actual financial data — it's a generic chat.

**Plan:**
- Build a financial summary string (current month income, expense, net worth, top 3 spending categories, budget goal status) and inject it as a system-level message at the start of each conversation
- Add a toggle in settings (`ai_context_enabled`) so users can opt out of sharing financial data with the AI

**Security & quality:**
- Never send raw transaction IDs, account IDs, or account numbers (last4) to the API
- Summarize amounts only (e.g., "Total expenses this month: $1,240 across 5 categories")
- The Gemini API key is already stored in `SecureStore` — do not expose it in logs or error messages
- Summary is computed client-side and sent over HTTPS to Google's API — remind the user of this in the settings toggle description

---

### 21. Light / Dark Mode
**Files:** new `context/ThemeContext.tsx`, `app/settings.tsx`, all screen/component files

- Create a `ThemeContext` that provides a `colorScheme: "dark" | "light"` value and a `toggle()` function
- Default: follow system preference via `useColorScheme()` from React Native
- Override: persist user's manual choice in the settings table (`theme` key)
- Replace all hardcoded color constants in `StyleSheet.create` calls with theme-aware values from the context

**Quality:**
- Introduce a `colors` object (same structure as the existing `COLORS` constant in stats.tsx) and make it theme-dependent — avoids scattering conditional logic across every file
- This is the largest refactor in the plan; tackle it last when the component tree is stable

---

## Complexity Summary

| # | Feature | Complexity | Schema change | New dependency |
|---|---|---|---|---|
| 1 | Edit & Delete Transaction | High | No* | No |
| 2 | Add Tx in Calendar | Low | No | No |
| 3 | Date Picker | Low | No | `datetimepicker` |
| 4 | Edit & Delete Financial Account | Medium | No | No |
| 5 | Add/Edit Category | Medium | No | No |
| 6 | Add Budget Goal | Low | No | No |
| 7 | Edit User Profile | Low | No | No |
| 8 | Change Password | Low | No | No |
| 9 | Delete User Account | Medium | No | No |
| 10 | Currency & Language | Medium | No | No |
| 11 | Transfer between Accounts | High | Yes (`transfer_id`) | No |
| 12 | CSV Export | Medium | No | `expo-sharing`, `expo-file-system` |
| 13 | Recurring Transactions | High | Yes (new table) | No |
| 14 | Empty State CTAs | Low | No | No |
| 15 | Onboarding Flow | Medium | No | No |
| 16 | Header Search & Options | Medium | No | No |
| 17 | Star Filter | Medium | Yes (`starred` col) | No |
| 18a | Stats: Overview tab | Medium | No | No |
| 18b | Stats: Multi-segment donut | Medium | No | No |
| 18c | Stats: Expandable month range | Low | No | No |
| 19 | Budget Alerts & Digest | High | No | `expo-notifications` |
| 20 | AI Chat context injection | Medium | No | No |
| 21 | Light / Dark Mode | High | No | No |

*Item 1 introduces `updateTransaction`; item 17 adds the `starred` column but reuses that same function.

---

## Completed
- `components/accounts/MonthlyView.tsx` — Add Financial Account modal
- `app/about.tsx` — About screen with app info, tech stack, developer credits
- `app/(tabs)/more.tsx` — About wired; Help & Support and Feedback disabled
