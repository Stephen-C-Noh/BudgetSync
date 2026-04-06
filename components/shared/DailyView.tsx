import { Colors, useTheme } from "@/context/ThemeContext";
import { formatDate } from "@/lib/dateUtils";
import { Category, Transaction } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import EmptyState from "./EmptyState";
import NavRow from "./NavRow";
import TxRow from "./TxRow";

type Props = {
  transactions: Transaction[];
  categories: Category[];
};

export default function DailyView({ transactions, categories }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const [date, setDate] = useState(new Date());
  const dateStr = formatDate(date);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const dayTxs = useMemo(
    () => transactions.filter((tx) => tx.date === dateStr),
    [transactions, dateStr]
  );

  const { income, expense } = useMemo(() => {
    let income = 0, expense = 0;
    for (const tx of dayTxs) {
      if (tx.type === "income") income += tx.amount;
      else expense += tx.amount;
    }
    return { income, expense };
  }, [dayTxs]);

  function prevDay() {
    setDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  }
  function nextDay() {
    setDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  }

  return (
    <>
      <NavRow label={dateStr} onPrev={prevDay} onNext={nextDay} />

      <View style={styles.summaryRow}>
        <View style={styles.summaryTile}>
          <View style={styles.tileIconRow}>
            <View style={[styles.tileIcon, { backgroundColor: colors.incomeSubtle }]}>
              <Ionicons name="arrow-down" size={16} color={colors.income} />
            </View>
            <Text style={styles.tileLabel}>Income</Text>
          </View>
          <Text style={styles.tileAmount}>${income.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryTile}>
          <View style={styles.tileIconRow}>
            <View style={[styles.tileIcon, { backgroundColor: colors.expenseSubtle }]}>
              <Ionicons name="arrow-up" size={16} color={colors.expense} />
            </View>
            <Text style={styles.tileLabel}>Expenses</Text>
          </View>
          <Text style={Text.tileAmount}>${expense.toFixed(2)}</Text>
        </View>
      </View>

      {/* FIXED: Only show this top button if there ARE transactions. 
          If the list is empty, the EmptyState button will handle it. */}
      {dayTxs.length > 0 && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push(`/add-transaction?date=${dateStr}`)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.onAccent} style={{ marginRight: 8 }} />
          <Text style={styles.addButtonText}>+ Add Transaction</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>TRANSACTIONS</Text>

      {dayTxs.length === 0 ? (
        <EmptyState
          icon="format-list-bulleted"
          title="No Transactions"
          description={`You haven't recorded any activity for ${dateStr}.`}
          buttonLabel="Add Transaction"
          onPress={() => router.push(`/add-transaction?date=${dateStr}`)}
        />
      ) : (
        dayTxs.map((tx) => (
          <TxRow key={tx.id} tx={tx} category={categoryMap.get(tx.category_id)} />
        ))
      )}
    </>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
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
    sectionTitle: { color: colors.textPrimary, marginBottom: 15, fontSize: 13, fontWeight: "800", letterSpacing: 1 },
    emptyState: { backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: "center" },
    emptyText: { color: colors.textSecondary, fontSize: 14 },
  });
}