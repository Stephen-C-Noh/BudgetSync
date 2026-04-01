import * as Crypto from "expo-crypto";
import * as SQLite from "expo-sqlite";
import { Account, BudgetGoal, Category, Setting, Transaction, UserProfile } from "./types";

const db = SQLite.openDatabaseAsync("budgetsync.db");

export async function initializeDatabase() {
  const database = await db;

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        last4 TEXT,
        balance REAL NOT NULL,
        currency TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT,
        is_custom INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        synced INTEGER NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS budget_goals (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        limit_amount REAL NOT NULL,
        period TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        currency TEXT NOT NULL,
        language TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
  `);

  // Seed default categories
  const catResult = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM categories"
  );
  if (catResult?.count === 0) {
    const defaultCategories = [
      { name: "Salary",        type: "income",  icon: "💰", is_custom: 0 },
      { name: "Investment",    type: "income",  icon: "📈", is_custom: 0 },
      { name: "Bonus",         type: "income",  icon: "🎁", is_custom: 0 },
      { name: "Freelance",     type: "income",  icon: "🧑‍💻", is_custom: 0 },
      { name: "Groceries",     type: "expense", icon: "🛒", is_custom: 0 },
      { name: "Dining",        type: "expense", icon: "🍽️", is_custom: 0 },
      { name: "Transport",     type: "expense", icon: "🚗", is_custom: 0 },
      { name: "Shopping",      type: "expense", icon: "🛍️", is_custom: 0 },
      { name: "Rent",          type: "expense", icon: "🏠", is_custom: 0 },
      { name: "Entertainment", type: "expense", icon: "🎬", is_custom: 0 },
      { name: "Utilities",     type: "expense", icon: "💡", is_custom: 0 },
    ];
    for (const cat of defaultCategories) {
      await database.runAsync(
        "INSERT INTO categories (id, name, type, icon, is_custom) VALUES (?, ?, ?, ?, ?)",
        [Crypto.randomUUID(), cat.name, cat.type, cat.icon, cat.is_custom]
      );
    }
  }

  // Seed default account
  const accResult = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM accounts"
  );
  if (accResult?.count === 0) {
    await database.runAsync(
      "INSERT INTO accounts (id, name, type, last4, balance, currency, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [Crypto.randomUUID(), "Main Account", "bank", "4821", 0, "USD", new Date().toISOString()]
    );
  }

  // Seed default user profile
  const profileResult = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM user_profile"
  );
  if (profileResult?.count === 0) {
    await database.runAsync(
      "INSERT INTO user_profile (id, name, email, currency, language) VALUES (?, ?, ?, ?, ?)",
      [Crypto.randomUUID(), "Alex Johnson", "alex.johnson@budgetsync.io", "USD", "EN-US"]
    );
  }
}

// ─── Accounts ────────────────────────────────────────────────────────────────

export async function getAccounts(): Promise<Account[]> {
  const database = await db;
  return database.getAllAsync<Account>("SELECT * FROM accounts ORDER BY created_at ASC");
}

export async function insertAccount(account: Account): Promise<void> {
  const database = await db;
  await database.runAsync(
    "INSERT INTO accounts (id, name, type, last4, balance, currency, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [account.id, account.name, account.type, account.last4 ?? null, account.balance, account.currency, account.created_at]
  );
}

export async function updateAccountBalance(id: string, balance: number): Promise<void> {
  const database = await db;
  await database.runAsync("UPDATE accounts SET balance = ? WHERE id = ?", [balance, id]);
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const database = await db;
  return database.getAllAsync<Category>("SELECT * FROM categories");
}

export async function insertCategory(category: Category): Promise<void> {
  const database = await db;
  await database.runAsync(
    "INSERT INTO categories (id, name, type, icon, is_custom) VALUES (?, ?, ?, ?, ?)",
    [category.id, category.name, category.type, category.icon ?? null, category.is_custom]
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const database = await db;
  await database.runAsync("DELETE FROM categories WHERE id = ?", [id]);
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactions(): Promise<Transaction[]> {
  const database = await db;
  return database.getAllAsync<Transaction>(
    "SELECT * FROM transactions ORDER BY created_at DESC"
  );
}

export async function insertTransaction(transaction: Transaction): Promise<void> {
  const database = await db;
  await database.runAsync(
    "INSERT INTO transactions (id, account_id, category_id, type, amount, note, date, created_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      transaction.id,
      transaction.account_id,
      transaction.category_id,
      transaction.type,
      transaction.amount,
      transaction.note ?? null,
      transaction.date,
      transaction.created_at,
      transaction.synced,
    ]
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  const database = await db;
  await database.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
}

// ─── Budget Goals ─────────────────────────────────────────────────────────────

export async function getBudgetGoals(): Promise<BudgetGoal[]> {
  const database = await db;
  return database.getAllAsync<BudgetGoal>("SELECT * FROM budget_goals");
}

export async function insertBudgetGoal(goal: BudgetGoal): Promise<void> {
  const database = await db;
  await database.runAsync(
    "INSERT INTO budget_goals (id, category_id, limit_amount, period, created_at) VALUES (?, ?, ?, ?, ?)",
    [goal.id, goal.category_id, goal.limit_amount, goal.period, goal.created_at]
  );
}

export async function deleteBudgetGoal(id: string): Promise<void> {
  const database = await db;
  await database.runAsync("DELETE FROM budget_goals WHERE id = ?", [id]);
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<UserProfile | null> {
  const database = await db;
  return database.getFirstAsync<UserProfile>("SELECT * FROM user_profile LIMIT 1");
}

export async function upsertUserProfile(profile: UserProfile): Promise<void> {
  const database = await db;
  await database.runAsync(
    "INSERT OR REPLACE INTO user_profile (id, name, email, currency, language) VALUES (?, ?, ?, ?, ?)",
    [profile.id, profile.name, profile.email, profile.currency, profile.language]
  );
}

// ─── Sync helpers ─────────────────────────────────────────────────────────────

export async function getUnsyncedTransactions(): Promise<Transaction[]> {
  const database = await db;
  return database.getAllAsync<Transaction>(
    "SELECT * FROM transactions WHERE synced = 0"
  );
}

export async function markTransactionSynced(id: string): Promise<void> {
  const database = await db;
  await database.runAsync("UPDATE transactions SET synced = 1 WHERE id = ?", [id]);
}

export async function upsertTransaction(transaction: Transaction): Promise<void> {
  const database = await db;
  await database.runAsync(
    "INSERT OR REPLACE INTO transactions (id, account_id, category_id, type, amount, note, date, created_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      transaction.id,
      transaction.account_id,
      transaction.category_id,
      transaction.type,
      transaction.amount,
      transaction.note ?? null,
      transaction.date,
      transaction.created_at,
      transaction.synced,
    ]
  );
}

export async function upsertAccount(account: Account): Promise<void> {
  const database = await db;
  await database.runAsync(
    "INSERT OR REPLACE INTO accounts (id, name, type, last4, balance, currency, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [account.id, account.name, account.type, account.last4 ?? null, account.balance, account.currency, account.created_at]
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Setting[]> {
  const database = await db;
  return database.getAllAsync<Setting>("SELECT * FROM settings");
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  const database = await db;
  await database.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [key, value]
  );
}
