# ADR-002: Data & Storage

## Title
Use expo-sqlite with Supabase for Local Data Persistence and Cross-Device Sync

## Status
Accepted

## Context
The application must store income, expense, and budget data persistently. The app needs to:
- Work both online and offline
- Sync data across multiple devices when online
- Stay cost-effective
- Retain data even after the app is closed

## Options Considered

### Temporary Component State
Loses all data on app close. Not viable for a persistent financial tracker.

### AsyncStorage
Local and simple, but has no querying capabilities, no structure, and no sync. Suitable for prototypes but not a real-world production scenario.

### expo-sqlite (Standalone)
Provides full offline capabilities and proper SQL querying. However, data resides only on one device with no sync or backup.

### expo-sqlite + Supabase (Hybrid, Local-First) ✅
SQLite handles local data storage while Supabase acts as the sync layer and remote backup. Changes are written locally first, then synced to Supabase when a connection is available. Supabase's free tier (500MB database, 2GB bandwidth) is more than sufficient for a personal expense tracker.

## Decision
We will use **expo-sqlite with Supabase** in a **local-first hybrid architecture**. SQLite is the primary store for all reads and writes; Supabase handles sync and cloud backup when the device is online.

## Consequences

### Pros
- **Reliability** — The app works fully offline regardless of connectivity.
- **Performance** — Local reads and writes are significantly faster than network calls. Queries for expense history, filters, and aggregations all run on local SQLite with no latency.
- **Proper Querying** — SQLite supports complex queries such as:
  ```sql
  SELECT SUM(amount) WHERE category = 'food' AND date > '2026-02-01'
  ```
  AsyncStorage cannot handle this.

### Cons
- **Sync Logic Complexity** — No-connection queuing, partial sync failures, retry logic, and conflict resolution add complexity to the project.
- **Two Data Sources to Maintain** — If the sync service has a bug, local SQLite and Supabase can drift. A reconciliation or full-resync mechanism may be needed as a fallback.
- **Schema Migration Difficulty** — When the SQLite schema needs an update, the migration must be handled in both SQLite and Supabase. Libraries like **Drizzle ORM** can help manage this.
- **Data Duplication** — Data is stored in two places. For an expense tracker this is negligible, but worth noting.
