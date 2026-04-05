import {
  deleteAccount as dbDeleteAccount,
  deleteBudgetGoal as dbDeleteBudgetGoal,
  deleteCategory as dbDeleteCategory,
  updateCategory as dbUpdateCategory,
  deleteTransaction as dbDeleteTransaction,
  updateAccount as dbUpdateAccount,
  updateTransaction as dbUpdateTransaction,
  getAccounts,
  getBudgetGoals,
  getCategories,
  getSettings,
  getTransactions,
  getUnsyncedTransactions,
  getUserProfile,
  initializeDatabase,
  insertAccount,
  insertBudgetGoal,
  insertCategory,
  insertTransaction,
  markTransactionSynced,
  updateAccountBalance,
  upsertSetting,
  upsertUserProfile,
} from "@/lib/db";
import {
  buildWeeklySummary,
  checkBudgetAlerts,
  scheduleLocalNotification,
} from "@/lib/notifications";
import {
  SyncUser,
  getSupabaseUser,
  pushAccounts,
  pushTransactions,
  signInSupabase,
  signOutSupabase,
  signUpSupabase,
} from "@/lib/supabase";
import {
  Account,
  BudgetGoal,
  Category,
  Setting,
  Transaction,
  UserProfile,
} from "@/lib/types";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

interface AppContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgetGoals: BudgetGoal[];
  userProfile: UserProfile | null;
  settings: Setting[];
  isLoading: boolean;
  syncUser: SyncUser | null;
}

interface AppActionsType {
  addAccount: (account: Account) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addBudgetGoal: (goal: BudgetGoal) => Promise<void>;
  deleteBudgetGoal: (id: string) => Promise<void>;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  loginSync: (email: string, password: string) => Promise<string | null>;
  signUpSync: (email: string, password: string) => Promise<string | null>;
  logoutSync: () => Promise<void>;
  reloadAll: () => Promise<void>;
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
  const [syncUser, setSyncUser] = useState<SyncUser | null>(null);
  const syncUserRef = useRef<SyncUser | null>(null);

  useEffect(() => {
    async function initialize() {
      await initializeDatabase();
      const [accs, cats, txs, goals, profile, sets, user] = await Promise.all([
        getAccounts(),
        getCategories(),
        getTransactions(),
        getBudgetGoals(),
        getUserProfile(),
        getSettings(),
        getSupabaseUser(),
      ]);
      setAccounts(accs);
      setCategories(cats);
      setTransactions(txs);
      setBudgetGoals(goals);
      setUserProfile(profile);
      setSettings(sets);
      setSyncUser(user);
      syncUserRef.current = user;
      setIsLoading(false);
    }
    initialize();
  }, []);

  // Foreground sync: push unsynced transactions + all accounts when app becomes active
  const accountsRef = useRef<Account[]>([]);
  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);

  /*
          Why refs instead of reading settings/transactions directly inside the listener?
            The useEffect with [] runs once and captures a stale closure 
            settings and transactions inside the listener would always be their initial empty arrays. 
            Refs always point to the latest value, which is why the existing code already 
            uses accountsRef and syncUserRef for the same reason.
  */
  const settingsRef = useRef<Setting[]>([]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const transactionsRef = useRef<Transaction[]>([]);
  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;
      // Weekly digest — runs for ALL users, no sync required
      const digestEnabled =
        settingsRef.current.find((s) => s.key === "weekly_digest")?.value ===
        "1";
      if (digestEnabled) {
        const lastDigest =
          settingsRef.current.find((s) => s.key === "last_digest_at")?.value ??
          "";
        const parsedLastDigest = lastDigest ? Date.parse(lastDigest) : NaN;
        const elapsed =
          lastDigest && !Number.isNaN(parsedLastDigest)
            ? Date.now() - parsedLastDigest
            : Infinity;
        if (elapsed >= 7 * 24 * 60 * 60 * 1000) {
          try {
            const summary = buildWeeklySummary(transactionsRef.current);
            await scheduleLocalNotification("Weekly Summary", summary);
            await updateSetting("last_digest_at", new Date().toISOString());
          } catch {
            // weekly digest failure is silent — will retry next foreground
          }
        }
      }

      if (!syncUserRef.current) return;
      try {
        const [unsynced] = await Promise.all([getUnsyncedTransactions()]);
        await Promise.all([
          unsynced.length > 0
            ? pushTransactions(unsynced, syncUserRef.current.id)
            : Promise.resolve(),
          accountsRef.current.length > 0
            ? pushAccounts(accountsRef.current, syncUserRef.current.id)
            : Promise.resolve(),
        ]);
        for (const t of unsynced) await markTransactionSynced(t.id);
        if (unsynced.length > 0) {
          setTransactions((prev) =>
            prev.map((t) =>
              unsynced.some((u) => u.id === t.id)
                ? { ...t, synced: 1 as const }
                : t,
            ),
          );
        }
      } catch {
        // Sync failure is silent — will retry next foreground
      }
    });
    return () => subscription.remove();
  }, []);

  const addAccount = async (account: Account) => {
    await insertAccount(account);
    setAccounts((prev) => [...prev, account]);
    if (syncUserRef.current) {
      try {
        await pushAccounts([account], syncUserRef.current.id);
      } catch {
        /* retry on next sync */
      }
    }
  };

  /**
   * Persists all mutable field changes to an account and refreshes local state.
   * Does not adjust transaction history — balance is stored directly.
   */
  const updateAccount = async (account: Account) => {
    await dbUpdateAccount(account);
    setAccounts((prev) => prev.map((a) => (a.id === account.id ? account : a)));
    if (syncUserRef.current) {
      try {
        await pushAccounts([account], syncUserRef.current.id);
      } catch {
        /* retry on next sync */
      }
    }
  };

  /**
   * Deletes an account and removes it from local state.
   * Transactions that reference this account are left intact (orphan-safe).
   */
  const deleteAccount = async (id: string) => {
    await dbDeleteAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const addTransaction = async (transaction: Transaction) => {
    await insertTransaction(transaction);
    // Update account balance
    const account = accounts.find((a) => a.id === transaction.account_id);
    if (account) {
      const delta =
        transaction.type === "income"
          ? transaction.amount
          : -transaction.amount;
      const newBalance = account.balance + delta;
      await updateAccountBalance(account.id, newBalance);
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === account.id ? { ...a, balance: newBalance } : a,
        ),
      );
    }
    setTransactions((prev) => [transaction, ...prev]);

    // Budget Alert Check!
    if (settings.find((s) => s.key === "budget_alerts")?.value === "1") {
      try {
        await checkBudgetAlerts(
          transaction,
          budgetGoals,
          transactions,
          categories,
        );
      } catch {
        /* notification failures should not block transaction creation */
      }
    }
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
          prev.map((a) =>
            a.id === account.id ? { ...a, balance: newBalance } : a,
          ),
        );
      }
    }
    await dbDeleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTransaction = async (tx: Transaction) => {
    await dbUpdateTransaction(tx);
    // Reload accounts from DB since the atomic update already adjusted balances
    const updatedAccounts = await getAccounts();
    setAccounts(updatedAccounts);
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
  };

  const addCategory = async (category: Category) => {
    await insertCategory(category);
    setCategories((prev) => [...prev, category]);
  };

  /**
   * Persists name and icon changes to a category and updates local state.
   * Type and is_custom are immutable after creation.
   */
  const updateCategory = async (category: Category) => {
    await dbUpdateCategory(category.id, category.name, category.icon);
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? category : c)),
    );
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

  const loginSync = async (
    email: string,
    password: string,
  ): Promise<string | null> => {
    const error = await signInSupabase(email, password);
    if (error) return error;
    const user = await getSupabaseUser();
    setSyncUser(user);
    syncUserRef.current = user;
    return null;
  };

  const signUpSync = async (
    email: string,
    password: string,
  ): Promise<string | null> => {
    const error = await signUpSupabase(email, password);
    if (error) return error;
    const user = await getSupabaseUser();
    setSyncUser(user);
    syncUserRef.current = user;
    return null;
  };

  const logoutSync = async () => {
    await signOutSupabase();
    setSyncUser(null);
    syncUserRef.current = null;
  };

  const reloadAll = async () => {
    const [accs, txs] = await Promise.all([getAccounts(), getTransactions()]);
    setAccounts(accs);
    setTransactions(txs);
  };

  return (
    <AppActionsContext.Provider
      value={{
        addAccount,
        updateAccount,
        deleteAccount,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addBudgetGoal,
        deleteBudgetGoal,
        updateUserProfile,
        updateSetting,
        loginSync,
        signUpSync,
        logoutSync,
        reloadAll,
      }}
    >
      <AppContext.Provider
        value={{
          accounts,
          categories,
          transactions,
          budgetGoals,
          userProfile,
          settings,
          isLoading,
          syncUser,
        }}
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
  if (!context)
    throw new Error("useAppActions must be used within AppProvider");
  return context;
}
