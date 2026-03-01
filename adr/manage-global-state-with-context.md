# ADR-003: State Management

## Title
Use React Context API for Global Financial State Management

## Status
Accepted

## Context
BudgetSync needs to manage financial data — income entries, expense entries, budget goals, and calculated totals — across multiple screens: Home, Add Income, Add Expense, Budget Summary, and Charts. This shared data requires a UI layer cache that holds the current session's view of financial data, hydrated from SQLite on app launch and kept in sync with SQLite through all write operations.

## Options Considered

### Prop Drilling
Passing props repeatedly from parent to child components makes the app harder to read and maintain, especially when multiple nested components require the same data.

### Redux
Redux is powerful and scalable, but introduces extra setup, boilerplate code, and architectural complexity that is unnecessary for a small-to-medium sized academic project like BudgetSync.

### React Context API ✅
Lightweight, built into React, and sufficient for managing shared state across a project of this scope.

## Decision
We will use the **React Context API** combined with `useState` and `useEffect` to manage shared financial data across the application.

**Context acts as an in-memory UI cache — not a data store.** The flow works as follows:

1. **On app launch** — a `useEffect` hook queries SQLite and loads the current data into Context so screens can read from memory for fast, instant rendering.
2. **On every write (add, edit, delete)** — the write always goes to SQLite first, then Context is updated to reflect the change.
3. **On app close/relaunch** — Context is simply rehydrated from SQLite again. No data is ever lost.

Screens consume the shared Context instead of querying SQLite directly or passing data manually through multiple component layers.

> **SQLite remains the single source of truth at all times.**

## Consequences

### Easier
- **Fast UI Access** — Screens read from in-memory Context for instant rendering, while SQLite remains the authoritative store underneath.
- **Cleaner Component Structure** — Components stay focused on UI rather than data passing, improving readability and maintainability.
- **Appropriate Complexity Level** — Keeps the architecture simple and aligned with the course scope while still following modern React practices.
- **Better Future Flexibility** — New screens (e.g., financial reports, AI recommendations) can easily consume the same shared context.

### More Difficult
- **Performance Considerations** — Context must always be hydrated from SQLite on startup. If this step fails or is skipped, the UI will show stale or empty data. A loading state must be handled explicitly.
- **Less Scalable Than Redux** — For very large enterprise-level applications, Redux may be more suitable. This project does not require that level of complexity.
- **Slight Learning Curve** — Setting up Context and organizing providers properly requires some additional planning compared to simple local state.
