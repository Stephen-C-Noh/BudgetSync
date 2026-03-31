import * as Crypto from "expo-crypto";
import * as SQLite from "expo-sqlite";

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

  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM categories",
  );
  if (result?.count === 0) {
    // Insert default categories
    const defaultCategories = [
      {
        id: Crypto.randomUUID(),
        name: "Salary",
        type: "income",
        icon: "💰",
        is_custom: 0,
      },
      {
        id: Crypto.randomUUID(),
        name: "Investment",
        type: "income",
        icon: "📈",
        is_custom: 0,
      },
      {
        id: Crypto.randomUUID(),
        name: "Bonus",
        type: "income",
        icon: "🎁",
        is_custom: 0,
      },
      {
        id: Crypto.randomUUID(),
        name: "Freelance",
        type: "income",
        icon: "🧑‍💻",
        is_custom: 0,
      },
      {
        id: Crypto.randomUUID(),
        name: "Groceries",
        type: "expense",
        icon: "🛒",
        is_custom: 0,
      },
      {
        id: Crypto.randomUUID(),
        name: "Dining",
        type: "expense",
        icon: "🍽️",
        is_custom: 0,
      },
      {
        id: Crypto.randomUUID(),
        name: "Transport",
        type: "expense",
        icon: "🚗",
        is_custom: 0,
      },
      {
        id: Crypto.randomUUID(),
        name: "Shopping",
        type: "expense",
        icon: "🛍️",
        is_custom: 0,
      },
      {
        id: Crypto.randomUUID(),
        name: "Rent",
        type: "expense",
        icon: "🏠",
        is_custom: 0,
      },
      {
        id: Crypto.randomUUID(),
        name: "Entertainment",
        type: "expense",
        icon: "🎬",
        is_custom: 0,
      },
      {
        id: Crypto.randomUUID(),
        name: "Utilities",
        type: "expense",
        icon: "💡",
        is_custom: 0,
      },
    ];
    for (const category of defaultCategories) {
      await database.runAsync(
        "INSERT INTO categories (id, name, type, icon, is_custom) VALUES (?, ?, ?, ?, ?)",
        [
          category.id,
          category.name,
          category.type,
          category.icon,
          category.is_custom,
        ],
      );
    }
  }
}

export { db };
