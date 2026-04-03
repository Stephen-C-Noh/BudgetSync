import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/context/ThemeContext";
import React, { useMemo, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Category, Transaction } from "@/lib/types";
import NavRow from "@/components/shared/NavRow";

const SCREEN_WIDTH = Dimensions.get("window").width;

type Props = {
  transactions: Transaction[];
  categories: Category[];
};

export default function HomeSummaryView({ transactions, categories }: Props) {
  const { colors } = useTheme();
  const [year, setYear] = useState(new Date().getFullYear());
  const currentMonth = new Date().getMonth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const chartConfig = useMemo(() => ({
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => `rgba(0, 217, 255, ${opacity})`,
    labelColor: () => colors.textSecondary,
    barPercentage: 0.6,
    decimalPlaces: 0,
  }), [colors]);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const { income, expense } = useMemo(() => {
    let income = 0, expense = 0;
    for (const tx of transactions) {
      const [y, m] = tx.date.split("-").map(Number);
      if (y === year && m - 1 === currentMonth) {
        if (tx.type === "income") income += tx.amount;
        else expense += tx.amount;
      }
    }
    return { income, expense };
  }, [transactions, year, currentMonth]);

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

      <Text style={styles.sectionLabel}>SPENDING BY CATEGORY</Text>
      {categoryTotals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No expense data this month.</Text>
        </View>
      ) : (
        <>
          {categoryTotals.length >= 2 && (
            <BarChart
              data={{
                labels: categoryTotals.slice(0, 6).map((c) => c.name.slice(0, 5)),
                datasets: [{ data: categoryTotals.slice(0, 6).map((c) => c.total) }],
              }}
              width={SCREEN_WIDTH - 40}
              height={200}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
            />
          )}
          {categoryTotals.map((c) => (
            <View key={c.name} style={styles.catRow}>
              <View style={styles.catRowTop}>
                <Text style={styles.catName}>{c.icon}  {c.name}</Text>
                <Text style={styles.catAmount}>${c.total.toFixed(2)}</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${expenseTotal > 0 ? (c.total / expenseTotal) * 100 : 0}%` as any }]} />
              </View>
            </View>
          ))}
        </>
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
    sectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: "800", letterSpacing: 1, marginBottom: 12 },
    chart: { borderRadius: 16, marginBottom: 20 },
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
