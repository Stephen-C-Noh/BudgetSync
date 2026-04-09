import { Account, BudgetGoal, Category, Transaction } from "@/lib/types";
import * as SecureStore from "expo-secure-store";

const GEMINI_KEY_STORE = "budgetsync_gemini_key";
const GEMINI_MODEL_STORE = "budgetsync_gemini_model";
const GEMINI_LIST_URL = "https://generativelanguage.googleapis.com/v1beta/models";

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
  await validateGeminiKey(key);
  return (await SecureStore.getItemAsync(GEMINI_MODEL_STORE)) ?? "gemini-2.0-flash";
}

function buildSystemPrompt(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  budgetGoals: BudgetGoal[],
  currency: string,
): string {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - 30);

  const recent = transactions.filter((t) => {
    const [y, m, d] = t.date.split("-").map(Number);
    return new Date(y, m - 1, d) >= cutoff;
  });
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
    .slice(0, 3)
    .map(([cat, amt]) => `  - ${cat}: ${currency} ${amt.toFixed(2)}`)
    .join("\n");

  // Net worth
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    if (a.type === "credit_card") liabilities += Math.abs(a.balance);
    else assets += a.balance;
  }
  const netWorth = assets - liabilities;

  const netWorthSection = `
Net worth:
- Assets: ${currency} ${assets.toFixed(2)} (across ${accounts.filter((a) => a.type !== "credit_card").length} account(s))
- Liabilities: ${currency} ${liabilities.toFixed(2)} (across ${accounts.filter((a) => a.type === "credit_card").length} card(s))
- Net worth: ${currency} ${netWorth.toFixed(2)}`;

  // Budget goal status
  let goalSection = "";
  if (budgetGoals.length > 0) {
    const goalLines: string[] = [];
    for (const goal of budgetGoals) {
      const catName = categoryMap.get(goal.category_id) ?? "Unknown";
      const periodTxs = transactions.filter((t) => {
        if (t.type !== "expense" || t.category_id !== goal.category_id) return false;
        const [y, m, d] = t.date.split("-").map(Number);
        const txDate = new Date(y, m - 1, d);
        if (goal.period === "monthly") {
          return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
        } else if (goal.period === "weekly") {
          const dayOfWeek = now.getDay();
          const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - mondayOffset);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          return txDate >= weekStart && txDate < weekEnd;
        } else {
          return txDate.getFullYear() === now.getFullYear();
        }
      });
      const spent = periodTxs.reduce((s, t) => s + t.amount, 0);
      const pct = goal.limit_amount > 0 ? Math.round((spent / goal.limit_amount) * 100) : 0;
      goalLines.push(`  - ${catName} (${goal.period}): ${currency} ${spent.toFixed(2)} / ${currency} ${goal.limit_amount.toFixed(2)} (${pct}%)`);
    }
    goalSection = `\nBudget goals:\n${goalLines.join("\n")}`;
  }

  return `You are SyncBot, a friendly and concise personal finance assistant inside the BudgetSync app. Answer the user's questions using their financial data below. The user's preferred currency is ${currency}. ALWAYS format money values using ${currency}. Keep responses brief and actionable.

User's last 30 days:
- Total income: ${currency} ${totalIncome.toFixed(2)}
- Total expenses: ${currency} ${totalExpense.toFixed(2)}
- Net: ${currency} ${(totalIncome - totalExpense).toFixed(2)}
- Top spending categories:
${breakdown || "  (no expense data yet)"}
${netWorthSection}${goalSection}`;
}

function buildGenericPrompt(currency: string): string {
  return `You are SyncBot, a friendly and concise personal finance assistant inside the BudgetSync app. The user has disabled financial context sharing, so you do not have access to their data. Answer general personal finance questions helpfully. The user's preferred currency is ${currency}. ALWAYS format money values using ${currency}. Keep responses brief and actionable.`;
}

export async function sendMessage(
  userMessage: string,
  history: GeminiTurn[],
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  budgetGoals: BudgetGoal[],
  currency: string,
  contextEnabled: boolean,
): Promise<string> {
  const key = await getGeminiKey();
  if (!key) throw new Error("NO_KEY");

  const model = await getModel(key);
  const url = `${GEMINI_LIST_URL}/${model}:generateContent?key=${key}`;

  const systemText = contextEnabled
    ? buildSystemPrompt(transactions, categories, accounts, budgetGoals, currency)
    : buildGenericPrompt(currency);

  const body = {
    system_instruction: {
      parts: [{ text: systemText }],
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
    if (res.status === 401 || res.status === 403) throw new Error("INVALID_KEY");
    throw new Error(msg ?? `API error ${res.status}`);
  }

  const data = await res.json();
  return (
    (data as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
      ?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response."
  );
}