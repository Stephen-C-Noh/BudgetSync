interface Account {
  id: string;
  name: string;
  type: "cash" | "bank" | "credit_card" | "investment";
  last4?: string;
  balance: number;
  currency: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  is_custom: 0 | 1;
}

interface Transaction {
  id: string;
  account_id: string;
  category_id: string;
  type: "income" | "expense";
  amount: number;
  note?: string;
  date: string;
  created_at: string;
  synced: 0 | 1;
}

interface BudgetGoal {
  id: string;
  category_id: string;
  limit_amount: number;
  period: "weekly" | "monthly" | "yearly";
  created_at: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  currency: string;
  language: string;
}

interface Setting {
  key: string;
  value: string;
}

export type {
  Account, BudgetGoal, Category, Setting, Transaction, UserProfile
};
