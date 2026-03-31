import {
  deleteCategory as dbDeleteCategory,
  deleteBudgetGoal as dbDeleteBudgetGoal,
  deleteTransaction as dbDeleteTransaction,
  getAccounts,
  getBudgetGoals,
  getCategories,
  getSettings,
  getTransactions,
  getUserProfile,
  initializeDatabase,
  insertAccount,
  insertBudgetGoal,
  insertCategory,
  insertTransaction,
  updateAccountBalance,
  upsertSetting,
  upsertUserProfile,
} from "@/lib/db";
import {
  Account,
  BudgetGoal,
  Category,
  Setting,
  Transaction,
  UserProfile,
} from "@/lib/types";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AppContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgetGoals: BudgetGoal[];
  userProfile: UserProfile | null;
  settings: Setting[];
  isLoading: boolean;
}

interface AppActionsType {
  addAccount: (account: Account) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addBudgetGoal: (goal: BudgetGoal) => Promise<void>;
  deleteBudgetGoal: (id: string) => Promise<void>;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);
const AppActionsContext = createContext<AppActionsType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      await initializeDatabase();
      const [accs, cats, txs, goals, profile, sets] = await Promise.all([
        getAccounts(),
        getCategories(),
        getTransactions(),
        getBudgetGoals(),
        getUserProfile(),
        getSettings(),
      ]);
      setAccounts(accs);
      setCategories(cats);
      setTransactions(txs);
      setBudgetGoals(goals);
      setUserProfile(profile);
      setSettings(sets);
      setIsLoading(false);
    }
    initialize();
  }, []);

  const addAccount = async (account: Account) => {
    await insertAccount(account);
    setAccounts((prev) => [...prev, account]);
  };

  const addTransaction = async (transaction: Transaction) => {
    await insertTransaction(transaction);
    // Update account balance
    const account = accounts.find((a) => a.id === transaction.account_id);
    if (account) {
      const delta = transaction.type === "income" ? transaction.amount : -transaction.amount;
      const newBalance = account.balance + delta;
      await updateAccountBalance(account.id, newBalance);
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, balance: newBalance } : a))
      );
    }
    setTransactions((prev) => [transaction, ...prev]);
  };

  const deleteTransaction = async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (tx) {
      // Reverse the balance effect
      const account = accounts.find((a) => a.id === tx.account_id);
      if (account) {
        const delta = tx.type === "income" ? -tx.amount : tx.amount;
        const newBalance = account.balance + delta;
        await updateAccountBalance(account.id, newBalance);
        setAccounts((prev) =>
          prev.map((a) => (a.id === account.id ? { ...a, balance: newBalance } : a))
        );
      }
    }
    await dbDeleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const addCategory = async (category: Category) => {
    await insertCategory(category);
    setCategories((prev) => [...prev, category]);
  };

  const deleteCategory = async (id: string) => {
    await dbDeleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const addBudgetGoal = async (goal: BudgetGoal) => {
    await insertBudgetGoal(goal);
    setBudgetGoals((prev) => [...prev, goal]);
  };

  const deleteBudgetGoal = async (id: string) => {
    await dbDeleteBudgetGoal(id);
    setBudgetGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const updateUserProfile = async (profile: UserProfile) => {
    await upsertUserProfile(profile);
    setUserProfile(profile);
  };

  const updateSetting = async (key: string, value: string) => {
    await upsertSetting(key, value);
    setSettings((prev) => {
      const exists = prev.find((s) => s.key === key);
      if (exists) return prev.map((s) => (s.key === key ? { key, value } : s));
      return [...prev, { key, value }];
    });
  };

  return (
    <AppActionsContext.Provider
      value={{
        addAccount,
        addTransaction,
        deleteTransaction,
        addCategory,
        deleteCategory,
        addBudgetGoal,
        deleteBudgetGoal,
        updateUserProfile,
        updateSetting,
      }}
    >
      <AppContext.Provider
        value={{ accounts, categories, transactions, budgetGoals, userProfile, settings, isLoading }}
      >
        {children}
      </AppContext.Provider>
    </AppActionsContext.Provider>
  );
};

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppState must be used within AppProvider");
  return context;
}

export function useAppActions() {
  const context = useContext(AppActionsContext);
  if (!context) throw new Error("useAppActions must be used within AppProvider");
  return context;
}
