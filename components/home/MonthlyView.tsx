import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MONTH_NAMES } from "@/lib/dateUtils";
import { Account, Category, Transaction } from "@/lib/types";
import NavRow from "@/components/shared/NavRow";
import TxRow from "@/components/shared/TxRow";

type Props = {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
};

export default function HomeMonthlyView({ accounts, transactions, categories }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const styles = useMemo(() => createStyles(colors), [colors]);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const totalBalance = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts]);
  const primaryAccount = accounts[0] ?? null;

  const { income, expense } = useMemo(() => {
    let income = 0, expense = 0;
    for (const tx of transactions) {
      const [y, m] = tx.date.split("-").map(Number);
      if (y === year && m - 1 === month) {
        if (tx.type === "income") income += tx.amount;
        else expense += tx.amount;
      }
    }
    return { income, expense };
  }, [transactions, year, month]);

  const monthTxs = useMemo(
    () => transactions.filter((tx) => {
      const [y, m] = tx.date.split("-").map(Number);
      return y === year && m - 1 === month;
    }),
    [transactions, year, month]
  );

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  return (
    <>
      <NavRow label={`${MONTH_NAMES[month]} ${year}`} onPrev={prevMonth} onNext={nextMonth} />

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>
          ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        {primaryAccount && (
          <View style={styles.cardRow}>
            <MaterialCommunityIcons name="credit-card-outline" size={16} color={colors.onAccent} />
            <Text style={styles.cardText}>
              {primaryAccount.last4 ? `•••• ${primaryAccount.last4}` : primaryAccount.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryTile}>
          <View style={styles.tileIconRow}>
            <View style={[styles.tileIcon, { backgroundColor: colors.incomeSubtle }]}>
              <Ionicons name="arrow-down" size={16} color={colors.income} />
            </View>
            <Text style={styles.tileLabel}>Income</Text>
          </View>
          <Text style={styles.tileAmount}>
            ${income.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.summaryTile}>
          <View style={styles.tileIconRow}>
            <View style={[styles.tileIcon, { backgroundColor: colors.expenseSubtle }]}>
              <Ionicons name="arrow-up" size={16} color={colors.expense} />
            </View>
            <Text style={styles.tileLabel}>Expenses</Text>
          </View>
          <Text style={styles.tileAmount}>
            ${expense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => router.push("/add-transaction")} activeOpacity={0.85}>
        <Ionicons name="add-circle-outline" size={20} color={colors.onAccent} style={{ marginRight: 8 }} />
        <Text style={styles.addButtonText}>+ Add Transaction</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionLabel, { marginTop: 28 }]}>TRANSACTIONS</Text>
      {monthTxs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No transactions this month.</Text>
        </View>
      ) : (
        monthTxs.map((tx) => {
          const dateLabel = new Date(tx.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
          return (
            <TxRow key={tx.id} tx={tx} category={categoryMap.get(tx.category_id)} dateLabel={dateLabel} />
          );
        })
      )}
    </>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    balanceCard: { backgroundColor: colors.accent, borderRadius: 24, padding: 24, marginBottom: 20 },
    balanceLabel: { color: colors.onAccent, fontSize: 14, fontWeight: "500" },
    balanceAmount: { color: colors.onAccent, fontSize: 36, fontWeight: "800", marginVertical: 8 },
    cardRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
    cardText: { color: colors.onAccent, fontSize: 13, marginLeft: 6 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
    summaryTile: { flex: 0.48, backgroundColor: colors.surface, borderRadius: 20, padding: 16 },
    tileIconRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    tileIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center", marginRight: 8 },
    tileLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: "500" },
    tileAmount: { color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 4 },
    addButton: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 4,
    },
    addButtonText: { color: colors.onAccent, fontSize: 16, fontWeight: "700" },
    sectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: "800", letterSpacing: 1, marginBottom: 12 },
    emptyState: { backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: "center" },
    emptyText: { color: colors.textSecondary, fontSize: 14 },
  });
}
