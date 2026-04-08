import { useAppState } from "@/context/AppContext";
import { Colors, useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const TOP_TABS = ["Overview", "Expenses", "Income"] as const;
type TopTab = (typeof TOP_TABS)[number];

function getRecentMonths(count: number) {
  const result = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  // Reverse so the oldest is on the left and the newest (current) is on the right
  return result.reverse();
}

const MONTH_OPTIONS = getRecentMonths(12);

export default function StatsScreen() {
  const { transactions, categories, budgetGoals, isLoading, userProfile } = useAppState();
  const { colors } = useTheme();
  const [activeTopTab, setActiveTopTab] = useState<TopTab>("Expenses");

  // Set initial selection to the last index (the most recent month)
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(MONTH_OPTIONS.length - 1);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const monthScrollRef = useRef<ScrollView>(null);

  const currency = userProfile?.currency || "CAD";
  const selectedMonth = MONTH_OPTIONS[selectedMonthIdx];
  const txType = activeTopTab === "Expenses" ? "expense" : activeTopTab === "Income" ? "income" : null;

  useEffect(() => {
    const timer = setTimeout(() => {
      monthScrollRef.current?.scrollToEnd({ animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const filteredTxs = useMemo(() => {
    return transactions.filter((tx) => {
      // Parse YYYY-MM-DD directly to avoid UTC-to-local day shift in new Date()
      const [y, m] = tx.date.split("-").map(Number);
      const matchMonth = y === selectedMonth.year && m - 1 === selectedMonth.month;
      const matchType = txType ? tx.type === txType : true;
      return matchMonth && matchType;
    });
  }, [transactions, selectedMonth, txType]);

  const totalAmount = useMemo(
    () => filteredTxs.reduce((sum, tx) => sum + tx.amount, 0),
    [filteredTxs]
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const totalMonthlyBudget = useMemo(
    () => budgetGoals.filter((g) => g.period === "monthly").reduce((sum, g) => sum + g.limit_amount, 0),
    [budgetGoals]
  );

  const breakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of filteredTxs) {
      map[tx.category_id] = (map[tx.category_id] ?? 0) + tx.amount;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([catId, amount], i) => ({
        label: categoryMap.get(catId)?.name ?? "Other",
        amount,
        color: colors.chartColors[i % colors.chartColors.length],
      }));
  }, [filteredTxs, categoryMap, colors.chartColors]);

  const topCategory = breakdown[0]?.label ?? "—";

  // Weekly totals (W1=1-7, W2=8-14, W3=15-21, W4=22+)
  const weeklyTotals = useMemo(() => {
    const weeks = [0, 0, 0, 0];
    for (const tx of filteredTxs) {
      // Read day directly from the YYYY-MM-DD string to avoid UTC shift
      const day = Number(tx.date.substring(8, 10));
      const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
      weeks[weekIdx] += tx.amount;
    }
    return weeks;
  }, [filteredTxs]);

  const maxWeekly = Math.max(...weeklyTotals, 1);

  // ─── Overview-specific computations ──────────────────────────────────────

  /**
   * Single-pass computation of all Overview-specific values.
   * Accumulates totalIncome, totalExpense, and per-week income/expense
   * arrays in one loop over filteredTxs rather than three separate passes.
   * Returns zeroed values when the Overview tab is not active.
   */
  const overviewData = useMemo(() => {
    const weeklyIncome = [0, 0, 0, 0];
    const weeklyExpense = [0, 0, 0, 0];
    let totalIncome = 0;
    let totalExpense = 0;

    if (activeTopTab === "Overview") {
      for (const tx of filteredTxs) {
        // Read day directly from the YYYY-MM-DD string to avoid UTC shift
        const day = Number(tx.date.substring(8, 10));
        const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
        if (tx.type === "income") {
          totalIncome += tx.amount;
          weeklyIncome[weekIdx] += tx.amount;
        } else {
          totalExpense += tx.amount;
          weeklyExpense[weekIdx] += tx.amount;
        }
      }
    }

    return { totalIncome, totalExpense, weeklyIncome, weeklyExpense };
  }, [filteredTxs, activeTopTab]);

  const { totalIncome, totalExpense, weeklyIncome, weeklyExpense } = overviewData;

  /** Shared scale ceiling for the dual-bar chart. */
  const maxDualBar = useMemo(
    () => Math.max(...weeklyIncome, ...weeklyExpense, 1),
    [weeklyIncome, weeklyExpense],
  );

  /** Net cashflow for the selected month: positive = surplus, negative = deficit. */
  const netCashflow = totalIncome - totalExpense;

  // Donut chart — show top category share
  const chart = useMemo(() => {
    const radius = 72;
    const strokeWidth = 16;
    const size = 190;
    const circumference = 2 * Math.PI * radius;
    const topAmount = breakdown[0]?.amount ?? 0;
    const progress = totalAmount > 0 ? Math.min(topAmount / totalAmount, 1) : 0;
    const strokeDashoffset = circumference - circumference * progress;
    return { radius, strokeWidth, size, circumference, strokeDashoffset, color: breakdown[0]?.color ?? colors.accent };
  }, [breakdown, totalAmount, colors.accent]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Stats</Text>

        <View style={styles.topTabs}>
          {TOP_TABS.map((tab) => {
            const isActive = activeTopTab === tab;
            return (
              <TouchableOpacity key={tab} style={styles.topTabButton} onPress={() => setActiveTopTab(tab)} activeOpacity={0.8}>
                <Text style={[styles.topTabText, isActive && styles.topTabTextActive]}>{tab}</Text>
                {isActive && <View style={styles.topTabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.monthScrollWrapper}>
          <ScrollView
            ref={monthScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthScrollContent}
          >
            {MONTH_OPTIONS.map((m, idx) => {
              const isActive = idx === selectedMonthIdx;
              return (
                <TouchableOpacity
                  key={m.label}
                  style={[styles.monthChip, isActive && styles.monthChipActive]}
                  onPress={() => setSelectedMonthIdx(idx)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.monthChipText, isActive && styles.monthChipTextActive]}>
                    {m.label.split(" ")[0]} {m.year}
                  </Text>
                  {isActive && <Ionicons name="chevron-down" size={12} color={colors.textPrimary} style={{ marginLeft: 2 }} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {activeTopTab === "Overview" ? (
          // ─── Overview layout ────────────────────────────────────────────────
          <>
            {totalIncome === 0 && totalExpense === 0 ? (
              /* Empty state — no transactions in the selected month */
              <View style={styles.card}>
                <Text style={styles.emptyText}>No data for this period.</Text>
              </View>
            ) : (
              <>
                {/* Net cashflow hero */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Net Cashflow</Text>
                  <Text
                    style={[
                      styles.netCashflowValue,
                      { color: netCashflow >= 0 ? colors.income : colors.expense },
                    ]}
                  >
                    {netCashflow >= 0 ? "+" : "-"}{currency} {Math.abs(netCashflow).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  <Text style={styles.netCashflowSubLabel}>
                    {netCashflow >= 0 ? "Surplus" : "Deficit"} for {selectedMonth.label}
                  </Text>
                </View>

                {/* Income vs Expense tiles */}
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryCard, { borderColor: colors.incomeSubtle }]}>
                    <View style={styles.tileLabelRow}>
                      <View style={[styles.tileDot, { backgroundColor: colors.income }]} />
                      <Text style={[styles.summaryLabel, { marginBottom: 0 }]}>Income</Text>
                    </View>
                    <Text style={[styles.summaryValue, { color: colors.income }]}>
                      {currency} {totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={[styles.summaryCard, { borderColor: colors.expenseSubtle }]}>
                    <View style={styles.tileLabelRow}>
                      <View style={[styles.tileDot, { backgroundColor: colors.expense }]} />
                      <Text style={[styles.summaryLabel, { marginBottom: 0 }]}>Expenses</Text>
                    </View>
                    <Text style={[styles.summaryValue, { color: colors.expense }]}>
                      {currency} {totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>

                {/* Dual-bar weekly chart: income (green) + expense (cyan) per week */}
                <View style={styles.card}>
                  <View style={styles.weekHeader}>
                    <Text style={styles.cardTitle}>Weekly Cashflow</Text>
                    <Text style={styles.weekSubtext}>Weeks of the Month</Text>
                  </View>
                  <View style={styles.dualBarLegend}>
                    <View style={styles.legendLeft}>
                      <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
                      <Text style={styles.legendText}>Income</Text>
                    </View>
                    <View style={[styles.legendLeft, { marginLeft: 16 }]}>
                      <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                      <Text style={styles.legendText}>Expenses</Text>
                    </View>
                  </View>
                  <View style={styles.weekChart}>
                    {[0, 1, 2, 3].map((i) => {
                      const incH = Math.max(
                        (weeklyIncome[i] / maxDualBar) * 90,
                        weeklyIncome[i] > 0 ? 6 : 0,
                      );
                      const expH = Math.max(
                        (weeklyExpense[i] / maxDualBar) * 90,
                        weeklyExpense[i] > 0 ? 6 : 0,
                      );
                      return (
                        <View key={i} style={styles.weekColumn}>
                          <View style={styles.dualBarPair}>
                            <View style={[styles.dualBar, { height: incH, backgroundColor: colors.income }]} />
                            <View style={[styles.dualBar, { height: expH, backgroundColor: colors.accent }]} />
                          </View>
                          <Text style={styles.weekLabel}>W{i + 1}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            )}
          </>
        ) : (
          // ─── Expenses / Income layout ───────────────────────────────────────
          <>
            {/* Summary cards */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>
                  {activeTopTab === "Income" ? "Total Income" : "Total Spending"}
                </Text>
                <Text style={styles.summaryValue}>
                  {currency} {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Monthly Budget</Text>
                {totalMonthlyBudget > 0 ? (
                  <>
                    <Text style={styles.summaryValue}>
                      {currency} {totalMonthlyBudget.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.min((totalAmount / totalMonthlyBudget) * 100, 100)}%` as any },
                        ]}
                      />
                    </View>
                  </>
                ) : (
                  <Text style={styles.noBudgetText}>No goals set</Text>
                )}
              </View>
            </View>

            {/* Spending / Income breakdown with donut chart */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {activeTopTab === "Income" ? "Income Breakdown" : "Spending Breakdown"}
              </Text>

              {breakdown.length === 0 ? (
                <Text style={styles.emptyText}>No data for this period.</Text>
              ) : (
                <>
                  <View style={styles.chartContainer}>
                    <View style={styles.chartWrapper}>
                      <Svg width={chart.size} height={chart.size}>
                        <Circle
                          stroke={colors.statsProgressTrack}
                          fill="none"
                          cx={chart.size / 2}
                          cy={chart.size / 2}
                          r={chart.radius}
                          strokeWidth={chart.strokeWidth}
                        />
                        <Circle
                          stroke={chart.color}
                          fill="none"
                          cx={chart.size / 2}
                          cy={chart.size / 2}
                          r={chart.radius}
                          strokeWidth={chart.strokeWidth}
                          strokeDasharray={`${chart.circumference} ${chart.circumference}`}
                          strokeDashoffset={chart.strokeDashoffset}
                          strokeLinecap="round"
                          rotation="-90"
                          origin={`${chart.size / 2}, ${chart.size / 2}`}
                        />
                      </Svg>
                      <View style={styles.chartCenter}>
                        <Text style={styles.chartCenterLabel}>TOP CATEGORY</Text>
                        <Text style={styles.chartCenterValue} numberOfLines={1} adjustsFontSizeToFit>
                          {topCategory}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.legendList}>
                    {breakdown.map((item) => (
                      <View key={item.label} style={styles.legendRow}>
                        <View style={styles.legendLeft}>
                          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                          <Text style={styles.legendText}>{item.label}</Text>
                        </View>
                        <Text style={styles.legendAmount}>
                          {currency} {item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* Weekly trends */}
            <View style={styles.card}>
              <View style={styles.weekHeader}>
                <Text style={styles.cardTitle}>Weekly Trends</Text>
                <Text style={styles.weekSubtext}>Weeks of the Month</Text>
              </View>
              <View style={styles.weekChart}>
                {weeklyTotals.map((val, i) => {
                  const barHeight = maxWeekly > 0 ? Math.max((val / maxWeekly) * 90, val > 0 ? 6 : 0) : 0;
                  return (
                    <View key={i} style={styles.weekColumn}>
                      <View style={[styles.bar, { height: barHeight }]} />
                      <Text style={styles.weekLabel}>W{i + 1}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 30 },
    headerTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "700", marginBottom: 18 },

    topTabs: { flexDirection: "row", gap: 18, marginBottom: 16 },
    topTabButton: { alignItems: "center", paddingBottom: 2 },
    topTabText: { color: colors.textSecondary, fontSize: 14, fontWeight: "500" },
    topTabTextActive: { color: colors.accent, fontWeight: "700" },
    topTabUnderline: { width: "100%", height: 2, marginTop: 6, borderRadius: 999, backgroundColor: colors.accent },

    monthScrollWrapper: { marginBottom: 18 },
    monthScrollContent: { paddingRight: 16, gap: 8 },
    monthChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.statsChip, minWidth: 90, justifyContent: "center" },
    monthChipActive: { backgroundColor: colors.accent },
    monthChipText: { color: colors.tabBarInactive, fontSize: 12, fontWeight: "600" },
    monthChipTextActive: { color: colors.textPrimary },

    summaryRow: { flexDirection: "row", gap: 12, marginBottom: 18 },
    summaryCard: { flex: 1, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    summaryLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 8 },
    summaryValue: { color: colors.textPrimary, fontSize: 22, fontWeight: "700", marginBottom: 8 },
    noBudgetText: { color: colors.textSecondary, fontSize: 13 },
    progressTrack: { height: 8, marginTop: 8, overflow: "hidden", borderRadius: 999, backgroundColor: colors.statsProgressTrack },
    progressFill: { height: "100%", borderRadius: 999, backgroundColor: colors.accent },

    card: { padding: 16, marginBottom: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", marginBottom: 14 },
    emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: "center", paddingVertical: 20 },

    chartContainer: { alignItems: "center", justifyContent: "center", marginTop: 8, marginBottom: 22 },
    chartWrapper: { width: 190, height: 190, alignItems: "center", justifyContent: "center" },
    chartCenter: { position: "absolute", width: 118, alignItems: "center", justifyContent: "center" },
    chartCenterLabel: { color: colors.textSecondary, fontSize: 9, fontWeight: "700", letterSpacing: 1.1, marginBottom: 6 },
    chartCenterValue: { maxWidth: 110, color: colors.textPrimary, fontSize: 14, fontWeight: "700", textAlign: "center" },

    legendList: { gap: 12 },
    legendRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    legendLeft: { flexDirection: "row", alignItems: "center" },
    legendDot: { width: 8, height: 8, borderRadius: 999, marginRight: 10 },
    legendText: { color: colors.tabBarInactive, fontSize: 14 },
    legendAmount: { color: colors.textPrimary, fontSize: 14, fontWeight: "600" },

    // ─── Overview styles ──────────────────────────────────────────────────────
    netCashflowValue: {
      fontSize: 38,
      fontWeight: "800",
      marginTop: 8,
      marginBottom: 4,
    },
    netCashflowSubLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    tileLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    tileDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      marginRight: 6,
    },
    dualBarLegend: {
      flexDirection: "row",
      marginBottom: 10,
    },
    dualBarPair: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 3,
      marginBottom: 8,
    },
    dualBar: {
      width: 14,
      borderRadius: 6,
    },
    // ─────────────────────────────────────────────────────────────────────────
    weekHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    weekSubtext: { color: colors.textSecondary, fontSize: 12 },
    weekChart: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 120, marginTop: 10, paddingHorizontal: 8 },
    weekColumn: { alignItems: "center" },
    bar: { width: 24, borderRadius: 10, marginBottom: 8, backgroundColor: colors.accent },
    weekLabel: { color: colors.tabBarInactive, fontSize: 12 },
  });
}
