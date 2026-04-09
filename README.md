# BudgetSync

A personal finance mobile app built with React Native and Expo. Track income and expenses, set budget goals, sync across devices, and get AI-powered financial insights.

## Features

- **Transaction tracking** - Log income and expenses with calculator-style input, categories, date picker, and star/favorite filter
- **Account management** - Multiple accounts (bank, cash, credit card, investment) with expandable cards showing per-account transaction history
- **Budget goals** - Set weekly, monthly, or yearly spending limits per category with progress tracking
- **Statistics** - Donut chart breakdown, net cashflow overview, dual-bar weekly chart, and 12-month scrollable range
- **AI chat** - SyncBot powered by Google Gemini (BYOK) with optional financial context injection (net worth, budget goals, top spending)
- **Cloud sync** - Supabase-backed login/signup with push/pull sync for transactions and accounts
- **Authentication** - Biometric auth with PIN fallback and 3-strike lockout
- **CSV export** - Export transactions by month with formula injection protection
- **Dark/light theme** - System-aware theming with manual override in settings
- **Onboarding** - Multi-step setup for name, currency, and initial account

## Tech Stack

- **Framework** - [React Native](https://reactnative.dev/) with [Expo SDK 54](https://expo.dev/)
- **Language** - TypeScript
- **Navigation** - [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- **Local storage** - [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **Cloud sync** - [Supabase](https://supabase.com/) (auth + Postgres)
- **AI** - [Google Gemini API](https://ai.google.dev/) (BYOK)
- **Auth** - [expo-local-authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/) (biometrics) + [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) (PIN, API keys)
- **Charts** - [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit) + [react-native-svg](https://github.com/software-mansion/react-native-svg)
- **Notifications** - [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) (budget alerts, weekly digest)

## Project Structure

```
app/
  (tabs)/            # Bottom tab screens
    index.tsx        # Home (Daily/Calendar/Monthly/Summary)
    accounts.tsx     # Accounts (Monthly/Summary per account)
    stats.tsx        # Statistics (Overview/Breakdown)
    ai-chat.tsx      # SyncBot AI chat
    more.tsx         # More menu
  add-transaction.tsx
  auth.tsx           # Biometric/PIN auth gate
  budget-goals.tsx
  category-settings.tsx
  onboarding.tsx
  settings.tsx
  sync-login.tsx     # Supabase login/signup
components/
  home/              # Home tab views
  accounts/          # Accounts tab views
  shared/            # Shared components (TxRow, CalendarView, EmptyState, etc.)
context/
  AppContext.tsx      # Global state + actions provider
  ThemeContext.tsx    # Dark/light theme provider
lib/
  db.ts              # SQLite CRUD operations
  supabase.ts        # Supabase client + sync functions
  gemini.ts          # Gemini AI integration
  auth.ts            # PIN management
  notifications.ts   # Budget alerts + weekly digest
  types.ts           # TypeScript type definitions
scripts/
  seed-supabase.sql  # Test data for Supabase
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/go) app on your phone

### Installation

```bash
git clone https://github.com/Stephen-C-Noh/BudgetSync.git
cd BudgetSync
npm install
cp .env.example .env.local
```

Edit `.env.local` with your Supabase project credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

You can find these in your [Supabase dashboard](https://supabase.com/dashboard) under Project Settings > API.

### Running

```bash
# Standard (local network)
npx expo start

# Tunnel mode (for WSL2 or restricted networks)
npx expo start --tunnel
```

Scan the QR code with Expo Go to run on your device.

### API Keys

- **Supabase** - Required. Set up via `.env.local` (see Installation above)
- **Gemini API key** - Optional. Enter in Settings to enable SyncBot AI chat (BYOK)

## Team

- **Changbeom (Stephen) Noh** - Core architecture, data layer, sync, AI, auth, Git workflow
- **Anthony Ogamba** - Calculator input, statistics visualizations, star filter
- **Fathema** - Currency/language settings, change password, account picker, empty state UI
