import NavRow from "@/components/shared/NavRow";
import { Colors, useTheme } from "@/context/ThemeContext";
import { Account, Category, Transaction } from "@/lib/types";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  currency?: string;
};

export default function AccountsSummaryView({ accounts, transactions, categories, currency = "CAD" }: Props) {
  const { colors } = useTheme();
  const [year, setYear] = useState(new Date().getFullYear());
  const currentMonth = new Date().getMonth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { netWorth, assets, liabilities } = useMemo(() => {
    let assets = 0, liabilities = 0;
    for (const a of accounts) {
      if (a.type === "credit_card") liabilities += Math.abs(a.balance);
      else assets += a.balance;
    }
    return { netWorth: assets - liabilities, assets, liabilities };
  }, [accounts]);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const categoryTotals = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; total: number }>();
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      const [y, m] = tx.date.split("-").map(Number);
      if (y !== year || m - 1 !== currentMonth) continue;
      const cat = categoryMap.get(tx.category_id);
      const entry = map.get(tx.category_id) ?? { name: cat?.name ?? "Other", icon: cat?.icon ?? "💳", total: 0 };
      entry.total += tx.amount;
      map.set(tx.category_id, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [transactions, categoryMap, year, currentMonth]);

  const expenseTotal = categoryTotals.reduce((s, c) => s + c.total, 0);

  return (
    <>
      <NavRow
        label={String(year)}
        onPrev={() => setYear((y) => y - 1)}
        onNext={() => setYear((y) => y + 1)}
      />

      <View style={styles.tilesRow}>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>NET WORTH</Text>
          <Text style={[styles.tileValue, { color: colors.accent }]}>
            {currency} {netWorth.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>ASSETS</Text>
          <Text style={[styles.tileValue, { color: colors.chartAssets }]}>
            {currency} {assets.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>LIABILITIES</Text>
          <Text style={[styles.tileValue, { color: colors.danger }]}>
            {currency} {liabilities.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>EXPENSE CATEGORIES</Text>
      {categoryTotals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No expense data this month.</Text>
        </View>
      ) : (
        categoryTotals.map((c) => (
          <View key={c.name} style={styles.catRow}>
            <View style={styles.catRowTop}>
              <Text style={styles.catName}>{c.icon}  {c.name}</Text>
              <Text style={styles.catAmount}>{currency} {c.total.toFixed(2)}</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${expenseTotal > 0 ? (c.total / expenseTotal) * 100 : 0}%` as any }]} />
            </View>
          </View>
        ))
      )}
    </>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    tilesRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
    tile: { flex: 0.31, backgroundColor: colors.surface, borderRadius: 20, padding: 14, alignItems: "center" },
    tileLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: "700", letterSpacing: 0.5, marginBottom: 6 },
    tileValue: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
    sectionTitle: { color: colors.textPrimary, marginBottom: 15, fontSize: 13, fontWeight: "800", letterSpacing: 1 },
    catRow: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 10 },
    catRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    catName: { color: colors.textPrimary, fontSize: 14, fontWeight: "600" },
    catAmount: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
    progressBg: { height: 6, backgroundColor: colors.background, borderRadius: 3, overflow: "hidden" },
    progressFill: { height: 6, backgroundColor: colors.accent, borderRadius: 3 },
    emptyState: { backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: "center" },
    emptyText: { color: colors.textSecondary, fontSize: 14 },
  });
}