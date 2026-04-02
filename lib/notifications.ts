import * as Notifications from "expo-notifications";
import { BudgetGoal, Category, Transaction } from "./types";

// Call once at startup to set how notifications appear when app is foregrounded
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      // old shouldShowAlert which is now deprecated but still required for backwards compatability.
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// Returns true if permission is granted, false otherwise
// Only calls requestPermissionsAsync if not already granted/denied
export async function ensureNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  if (status === "denied") return false; // already denied. don't re-request
  const { status: newStatus } = await Notifications.requestPermissionsAsync();
  return newStatus === "granted";
}

export async function scheduleLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null, // null = deliver immediately
    // trigger: null fires the notification right away as a local notification, no server needed.
    // Never pass financial totals in title. keep it to category names and percentages only.
  });
}

export async function checkBudgetAlerts(
  newTx: Transaction,
  goals: BudgetGoal[],
  allTransaction: Transaction[],
  categories: Category[],
) {
  if (newTx.type !== "expense") return; // if the new transaction is an income, no need for check.

  const now = new Date();
  // Find monthly goal for this transaction's category
  const goal = goals.find(
    (g) => g.category_id === newTx.category_id && g.period === "monthly",
  );

  if (!goal) return; // if no goal is set for this category, no need for check.

  const categoryName =
    categories.find((c) => c.id === newTx.category_id)?.name ?? "Unknown";

  const monthlyspending =
    allTransaction
      .filter(
        (tx) =>
          tx.category_id === newTx.category_id &&
          tx.type === "expense" &&
          new Date(tx.date).getFullYear() === now.getFullYear() &&
          new Date(tx.date).getMonth() === now.getMonth(),
      )
      .reduce((sum, tx) => sum + tx.amount, 0) + newTx.amount;

  const pct = monthlyspending / goal.limit_amount;
  if (pct >= 0.8 && pct < 1.0) {
    await scheduleLocalNotification(
      "Budget WARNING",
      `You have used ${Math.round(pct * 100)}% of your ${categoryName} budget.`,
    );
  } else if (pct >= 1.0) {
    await scheduleLocalNotification(
      "Budget EXCEEDED",
      `You have exceeded your ${categoryName} budget.`,
    );
  }
}

export function buildWeeklySummary(transactions: Transaction[]): string {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recent = transactions.filter((tx) => new Date(tx.date) >= weekAgo);

  const income = recent
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expense = recent
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return `This week: +$${income.toFixed(2)} income, -$${expense.toFixed(2)} expenses.`;
}
