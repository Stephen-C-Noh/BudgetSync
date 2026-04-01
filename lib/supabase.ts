import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
import { Account, Transaction } from "@/lib/types";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

console.log("[Supabase] URL:", SUPABASE_URL ?? "UNDEFINED ← env var not loaded");

const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type SyncUser = { id: string; email: string };

export async function getSupabaseUser(): Promise<SyncUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return { id: user.id, email: user.email };
}

// Returns null on success, error message on failure.
export async function signInSupabase(
  email: string,
  password: string
): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error?.message ?? null;
}

// Returns null on success, error message on failure.
export async function signUpSupabase(
  email: string,
  password: string
): Promise<string | null> {
  const { error } = await supabase.auth.signUp({ email, password });
  return error?.message ?? null;
}

export async function signOutSupabase(): Promise<void> {
  await supabase.auth.signOut();
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

// Push transactions to Supabase (upsert by id). Strips local `synced` flag.
export async function pushTransactions(
  transactions: Transaction[],
  userId: string
): Promise<void> {
  if (transactions.length === 0) return;
  const rows = transactions.map(({ synced: _s, ...t }) => ({
    ...t,
    user_id: userId,
  }));
  const { error } = await supabase.from("transactions").upsert(rows);
  if (error) throw new Error(error.message);
}

// Pull all transactions for user. Returns them with synced = 1.
export async function pullTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, account_id, category_id, type, amount, note, date, created_at")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((t) => ({
    ...(t as Omit<Transaction, "synced">),
    synced: 1 as const,
  }));
}

// Push accounts to Supabase (upsert by id).
export async function pushAccounts(
  accounts: Account[],
  userId: string
): Promise<void> {
  if (accounts.length === 0) return;
  const rows = accounts.map((a) => ({ ...a, user_id: userId }));
  const { error } = await supabase.from("accounts").upsert(rows);
  if (error) throw new Error(error.message);
}

// Pull all accounts for user.
export async function pullAccounts(userId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, type, last4, balance, currency, created_at")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []) as Account[];
}
