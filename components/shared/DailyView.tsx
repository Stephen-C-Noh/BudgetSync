import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatDate } from "@/lib/dateUtils";
import { Category, Transaction } from "@/lib/types";
import NavRow from "./NavRow";
import TxRow from "./TxRow";

type Props = {
  transactions: Transaction[];
  categories: Category[];
};

export default function DailyView({ transactions, categories }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const dateStr = formatDate(date);

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
            <View style={[styles.tileIcon, { backgroundColor: "rgba(0, 200, 83, 0.12)" }]}>
              <Ionicons name="arrow-down" size={16} color="#00C853" />
            </View>
            <Text style={styles.tileLabel}>Income</Text>
          </View>
          <Text style={styles.tileAmount}>${income.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryTile}>
          <View style={styles.tileIconRow}>
            <View style={[styles.tileIcon, { backgroundColor: "rgba(255, 59, 48, 0.12)" }]}>
              <Ionicons name="arrow-up" size={16} color="#FF3B30" />
            </View>
            <Text style={styles.tileLabel}>Expenses</Text>
          </View>
          <Text style={styles.tileAmount}>${expense.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push(`/add-transaction?date=${dateStr}`)}
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle-outline" size={20} color="#0B1519" style={{ marginRight: 8 }} />
        <Text style={styles.addButtonText}>+ Add Transaction</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>TRANSACTIONS</Text>
      {dayTxs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No transactions on this day.</Text>
        </View>
      ) : (
        dayTxs.map((tx) => (
          <TxRow key={tx.id} tx={tx} category={categoryMap.get(tx.category_id)} />
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  summaryTile: { flex: 0.48, backgroundColor: "#1C252E", borderRadius: 20, padding: 16 },
  tileIconRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  tileIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center", marginRight: 8 },
  tileLabel: { color: "#7A869A", fontSize: 13, fontWeight: "500" },
  tileAmount: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  addButton: {
    backgroundColor: "#00D4FF",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  addButtonText: { color: "#0B1519", fontSize: 16, fontWeight: "700" },
  sectionTitle: { color: "#fff", marginBottom: 15, fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  emptyState: { backgroundColor: "#1C252E", borderRadius: 16, padding: 24, alignItems: "center" },
  emptyText: { color: "#7A869A", fontSize: 14 },
});
