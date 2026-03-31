import { initializeDatabase } from "@/lib/db";
import {
    Account,
    BudgetGoal,
    Category,
    Setting,
    Transaction,
    UserProfile,
} from "@/lib/types";
import React, { createContext, useEffect, useState } from "react";

interface AppContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgetGoals: BudgetGoal[];
  userProfile: UserProfile | null;
  settings: Setting[];
}

interface AppActionsType {
  // Define actions here, e.g.:
  addAccount: (account: Account) => void;
  updateUserProfile: (profile: UserProfile) => void;
  addTransaction: (transaction: Transaction) => void;
  updateSetting: (setting: Setting) => void;
  // Add more actions as needed
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

  useEffect(() => {
    async function initialize() {
      await initializeDatabase();
    }
    initialize();
  }, []);

  const addAccount = (account: Account) => {
    // Implement logic to add account to database and update state
  };

  const updateUserProfile = (profile: UserProfile) => {
    // Implement logic to update user profile in database and state
  };

  const addTransaction = (transaction: Transaction) => {
    // Implement logic to add transaction to database and update state
  };
  const updateSetting = (setting: Setting) => {
    // Implement logic to update setting in database and state
  };

  return (
    <AppActionsContext.Provider
      value={{
        addAccount,
        updateUserProfile,
        addTransaction,
        updateSetting,
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
        }}
      >
        {children}
      </AppContext.Provider>
    </AppActionsContext.Provider>
  );
};

export function useAppState() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppProvider");
  }
  return context;
}

export function useAppActions() {
  const context = React.useContext(AppActionsContext);
  if (!context) {
    throw new Error("useAppActions must be used within an AppProvider");
  }
  return context;
}

// Comment from instructor:
// There is 'UseMemo'.
// to memoize the context value if needed,
// especially if you have actions that update
// the state and you want to prevent unnecessary
// re-renders of consuming components.

// My question:
// How do I use 'UseMemo' in this context?
// Is it necessary/recommended to use 'UseMemo' here? If so, how would I implement it?

// Regarding the use of 'useMemo':
// It can be beneficial to use 'useMemo' to memoize the context value,
// especially if the actions or state updates cause re-renders of consuming components.
// This can help optimize performance by preventing unnecessary re-renders
// when the context value changes.

// To implement 'useMemo', you can wrap the context value in a 'useMemo' hook like this:

// const memoizedValue = useMemo(() => ({
//   accounts,
//   categories,
//   transactions,
//   budgetGoals,
//   userProfile,
//   settings,
// }), [accounts, categories, transactions, budgetGoals, userProfile, settings]);

// Then, you would pass 'memoizedValue' to the provider instead of the raw state values.
// This way, the context value will only change when one of the dependencies changes,
// preventing unnecessary re-renders of consuming components that rely on this context.
