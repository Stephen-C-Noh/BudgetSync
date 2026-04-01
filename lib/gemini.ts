import * as SecureStore from "expo-secure-store";
import { Category, Transaction } from "@/lib/types";

const GEMINI_KEY_STORE = "budgetsync_gemini_key";
const GEMINI_MODEL_STORE = "budgetsync_gemini_model";
const GEMINI_LIST_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Preferred free-tier models in order — first one found in the account wins.
const MODEL_PREFERENCE = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

export type GeminiTurn = {
  role: "user" | "model";
  parts: [{ text: string }];
};

export async function getGeminiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(GEMINI_KEY_STORE);
}

export async function saveGeminiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(GEMINI_KEY_STORE, key.trim());
}

export async function clearGeminiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(GEMINI_KEY_STORE);
  await SecureStore.deleteItemAsync(GEMINI_MODEL_STORE);
}

// Returns null on success, or an error message string on failure.
// On success, detects and caches the best available free-tier model.
export async function validateGeminiKey(key: string): Promise<string | null> {
  try {
    const trimmed = key.trim();
    const res = await fetch(`${GEMINI_LIST_URL}?key=${trimmed}&pageSize=50`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as { error?: { message?: string } })?.error?.message;
      return msg ?? `API error ${res.status}`;
    }

    const data = await res.json();
    type ApiModel = { name: string; supportedGenerationMethods?: string[] };
    const available = ((data as { models?: ApiModel[] }).models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace("models/", ""));

    const chosen =
      MODEL_PREFERENCE.find((p) => available.includes(p)) ??
      available[0] ??
      "gemini-2.0-flash";

    await SecureStore.setItemAsync(GEMINI_MODEL_STORE, chosen);
    return null;
  } catch {
    return "Network error. Check your connection and try again.";
  }
}

async function getModel(key: string): Promise<string> {
  const saved = await SecureStore.getItemAsync(GEMINI_MODEL_STORE);
  if (saved) return saved;
  // First sendMessage after key was stored without model detection — detect now.
  await validateGeminiKey(key);
  return (await SecureStore.getItemAsync(GEMINI_MODEL_STORE)) ?? "gemini-2.0-flash";
}

function buildSystemPrompt(
  transactions: Transaction[],
  categories: Category[]
): string {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - 30);

  const recent = transactions.filter((t) => new Date(t.date) >= cutoff);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const expenseByCategory = new Map<string, number>();
  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of recent) {
    if (t.type === "expense") {
      const name = categoryMap.get(t.category_id) ?? "Other";
      expenseByCategory.set(name, (expenseByCategory.get(name) ?? 0) + t.amount);
      totalExpense += t.amount;
    } else {
      totalIncome += t.amount;
    }
  }

  const breakdown = Array.from(expenseByCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `  - ${cat}: $${amt.toFixed(2)}`)
    .join("\n");

  return `You are SyncBot, a friendly and concise personal finance assistant inside the BudgetSync app. Answer the user's questions using their financial data below. Keep responses brief and actionable.

User's last 30 days:
- Total income: $${totalIncome.toFixed(2)}
- Total expenses: $${totalExpense.toFixed(2)}
- Net: $${(totalIncome - totalExpense).toFixed(2)}
- Expense breakdown by category:
${breakdown || "  (no expense data yet)"}`;
}

export async function sendMessage(
  userMessage: string,
  history: GeminiTurn[],
  transactions: Transaction[],
  categories: Category[]
): Promise<string> {
  const key = await getGeminiKey();
  if (!key) throw new Error("NO_KEY");

  const model = await getModel(key);
  const url = `${GEMINI_LIST_URL}/${model}:generateContent?key=${key}`;

  const body = {
    system_instruction: {
      parts: [{ text: buildSystemPrompt(transactions, categories) }],
    },
    contents: [
      ...history,
      { role: "user", parts: [{ text: userMessage }] },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } })?.error?.message;
    // Only treat explicit auth failures as INVALID_KEY
    if (res.status === 401 || res.status === 403) throw new Error("INVALID_KEY");
    throw new Error(msg ?? `API error ${res.status}`);
  }

  const data = await res.json();
  return (
    (data as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
      ?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response."
  );
}
