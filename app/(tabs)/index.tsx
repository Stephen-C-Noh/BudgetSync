import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppState } from "@/context/AppContext";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart } from "react-native-chart-kit";

const VIEW_TABS = ["Daily", "Calendar", "Monthly", "Summary"];
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SCREEN_WIDTH = Dimensions.get("window").width;

const CHART_CONFIG = {
  backgroundGradientFrom: "#1C252E",
  backgroundGradientTo: "#1C252E",
  color: (opacity = 1) => `rgba(0, 212, 255, ${opacity})`,
  labelColor: () => "#7A869A",
  barPercentage: 0.6,
  decimalPlaces: 0,
};

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function TodayScreen() {
  const router = useRouter();
  const { accounts, transactions, categories, isLoading } = useAppState();
  const [activeTab, setActiveTab] = useState("Monthly");
  const [year, setYear] = useState(new Date().getFullYear());

  // Daily tab state
  const [dailyDate, setDailyDate] = useState<Date>(new Date());

  // Calendar tab state
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calSelected, setCalSelected] = useState<string | null>(null);

  const _today = new Date();
  const todayDisplay = `${String(_today.getMonth() + 1).padStart(2, "0")}-${String(_today.getDate()).padStart(2, "0")}`;
  const currentMonth = _today.getMonth();

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const totalBalance = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts]);
  const primaryAccount = accounts[0] ?? null;

  // Monthly income / expense (uses year state + real current month)
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    let income = 0, expense = 0;
    for (const tx of transactions) {
      const [y, m] = tx.date.split("-").map(Number);
      if (y === year && m - 1 === currentMonth) {
        if (tx.type === "income") income += tx.amount;
        else expense += tx.amount;
      }
    }
    return { monthlyIncome: income, monthlyExpense: expense };
  }, [transactions, year, currentMonth]);

  // Monthly transactions list
  const monthlyTransactions = useMemo(
    () => transactions.filter((tx) => {
      const [y, m] = tx.date.split("-").map(Number);
      return y === year && m - 1 === currentMonth;
    }),
    [transactions, year, currentMonth]
  );

  // Daily tab
  const dailyDateStr = formatDate(dailyDate);
  const dailyTransactions = useMemo(
    () => transactions.filter((tx) => tx.date === dailyDateStr),
    [transactions, dailyDateStr]
  );
  const { dailyIncome, dailyExpense } = useMemo(() => {
    let income = 0, expense = 0;
    for (const tx of dailyTransactions) {
      if (tx.type === "income") income += tx.amount;
      else expense += tx.amount;
    }
    return { dailyIncome: income, dailyExpense: expense };
  }, [dailyTransactions]);

  // Calendar tab
  const calDays = useMemo(() => buildCalendarDays(calYear, calMonth), [calYear, calMonth]);
  const txDatesSet = useMemo(() => {
    const s = new Set<string>();
    for (const tx of transactions) {
      const [y, m] = tx.date.split("-").map(Number);
      if (y === calYear && m - 1 === calMonth) s.add(tx.date);
    }
    return s;
  }, [transactions, calYear, calMonth]);
  const calSelectedTxs = useMemo(
    () => (calSelected ? transactions.filter((tx) => tx.date === calSelected) : []),
    [transactions, calSelected]
  );

  // Summary tab: expense categories for current month
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

  const summaryExpenseTotal = categoryTotals.reduce((s, c) => s + c.total, 0);

  function prevCalMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
    setCalSelected(null);
  }
  function nextCalMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
    setCalSelected(null);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color="#00D4FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateLabel}>{todayDisplay}</Text>
          <View style={styles.headerIcons}>
            <Ionicons name="search-outline" size={22} color="#fff" style={{ marginRight: 18 }} />
            <Ionicons name="star-outline" size={22} color="#fff" style={{ marginRight: 18 }} />
            <Ionicons name="options-outline" size={22} color="#fff" />
          </View>
        </View>

        {/* Day navigator — Daily tab */}
        {activeTab === "Daily" && (
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => setDailyDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })}>
              <Ionicons name="chevron-back" size={20} color="#A7B1C2" />
            </TouchableOpacity>
            <Text style={styles.navLabel}>{dailyDateStr}</Text>
            <TouchableOpacity onPress={() => setDailyDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}>
              <Ionicons name="chevron-forward" size={20} color="#A7B1C2" />
            </TouchableOpacity>
          </View>
        )}

        {/* Month navigator — Calendar tab */}
        {activeTab === "Calendar" && (
          <View style={styles.navRow}>
            <TouchableOpacity onPress={prevCalMonth}>
              <Ionicons name="chevron-back" size={20} color="#A7B1C2" />
            </TouchableOpacity>
            <Text style={styles.navLabel}>{MONTH_NAMES[calMonth]} {calYear}</Text>
            <TouchableOpacity onPress={nextCalMonth}>
              <Ionicons name="chevron-forward" size={20} color="#A7B1C2" />
            </TouchableOpacity>
          </View>
        )}

        {/* Year navigator — Monthly and Summary tabs */}
        {(activeTab === "Monthly" || activeTab === "Summary") && (
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => setYear((y) => y - 1)}>
              <Ionicons name="chevron-back" size={20} color="#A7B1C2" />
            </TouchableOpacity>
            <Text style={styles.navLabel}>{year}</Text>
            <TouchableOpacity onPress={() => setYear((y) => y + 1)}>
              <Ionicons name="chevron-forward" size={20} color="#A7B1C2" />
            </TouchableOpacity>
          </View>
        )}

        {/* View mode tabs */}
        <View style={styles.tabsRow}>
          {VIEW_TABS.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              {activeTab === tab && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── DAILY ────────────────────────────────────────────── */}
        {activeTab === "Daily" && (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryTile}>
                <View style={styles.tileIconRow}>
                  <View style={[styles.tileIcon, { backgroundColor: "rgba(0, 200, 83, 0.12)" }]}>
                    <Ionicons name="arrow-down" size={16} color="#00C853" />
                  </View>
                  <Text style={styles.tileLabel}>Income</Text>
                </View>
                <Text style={styles.tileAmount}>${dailyIncome.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryTile}>
                <View style={styles.tileIconRow}>
                  <View style={[styles.tileIcon, { backgroundColor: "rgba(255, 59, 48, 0.12)" }]}>
                    <Ionicons name="arrow-up" size={16} color="#FF3B30" />
                  </View>
                  <Text style={styles.tileLabel}>Expenses</Text>
                </View>
                <Text style={styles.tileAmount}>${dailyExpense.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={() => router.push(`/add-transaction?date=${dailyDateStr}`)} activeOpacity={0.85}>
              <Ionicons name="add-circle-outline" size={20} color="#0B1519" style={{ marginRight: 8 }} />
              <Text style={styles.addButtonText}>+ Add Transaction</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>TRANSACTIONS</Text>
            {dailyTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No transactions on this day.</Text>
              </View>
            ) : (
              dailyTransactions.map((tx) => {
                const cat = categoryMap.get(tx.category_id);
                return (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={styles.txLeft}>
                      <View style={styles.txIconBox}>
                        <Text style={styles.txEmoji}>{cat?.icon ?? "💳"}</Text>
                      </View>
                      <View>
                        <Text style={styles.txName}>{tx.note || cat?.name || "Transaction"}</Text>
                        <Text style={styles.txMeta}>{cat?.name ?? "—"}</Text>
                      </View>
                    </View>
                    <Text style={[styles.txAmount, tx.type === "expense" ? styles.expenseColor : styles.incomeColor]}>
                      {tx.type === "expense" ? "-" : "+"}${tx.amount.toFixed(2)}
                    </Text>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── CALENDAR ─────────────────────────────────────────── */}
        {activeTab === "Calendar" && (
          <>
            <View style={styles.calWeekRow}>
              {WEEK_DAYS.map((d) => (
                <Text key={d} style={styles.calWeekLabel}>{d}</Text>
              ))}
            </View>
            <View style={styles.calGrid}>
              {calDays.map((day, i) => {
                if (!day) return <View key={i} style={styles.calCell} />;
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const hasTx = txDatesSet.has(dateStr);
                const isSelected = calSelected === dateStr;
                const isToday = dateStr === formatDate(new Date());
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.calCell, isSelected && styles.calCellSelected]}
                    onPress={() => setCalSelected(isSelected ? null : dateStr)}
                  >
                    <Text style={[styles.calDayText, isToday && styles.calDayToday, isSelected && styles.calDaySelected]}>
                      {day}
                    </Text>
                    {hasTx && <View style={[styles.calDot, isSelected && { backgroundColor: "#0B1519" }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {calSelected && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 8 }]}>{calSelected}</Text>
                {calSelectedTxs.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No transactions on this day.</Text>
                  </View>
                ) : (
                  calSelectedTxs.map((tx) => {
                    const cat = categoryMap.get(tx.category_id);
                    return (
                      <View key={tx.id} style={styles.txRow}>
                        <View style={styles.txLeft}>
                          <View style={styles.txIconBox}>
                            <Text style={styles.txEmoji}>{cat?.icon ?? "💳"}</Text>
                          </View>
                          <View>
                            <Text style={styles.txName}>{tx.note || cat?.name || "Transaction"}</Text>
                            <Text style={styles.txMeta}>{cat?.name ?? "—"}</Text>
                          </View>
                        </View>
                        <Text style={[styles.txAmount, tx.type === "expense" ? styles.expenseColor : styles.incomeColor]}>
                          {tx.type === "expense" ? "-" : "+"}${tx.amount.toFixed(2)}
                        </Text>
                      </View>
                    );
                  })
                )}
              </>
            )}
          </>
        )}

        {/* ── MONTHLY ──────────────────────────────────────────── */}
        {activeTab === "Monthly" && (
          <>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>
                ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              {primaryAccount && (
                <View style={styles.cardRow}>
                  <MaterialCommunityIcons name="credit-card-outline" size={16} color="rgba(0,0,0,0.55)" />
                  <Text style={styles.cardText}>
                    {primaryAccount.last4 ? `•••• ${primaryAccount.last4}` : primaryAccount.name}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryTile}>
                <View style={styles.tileIconRow}>
                  <View style={[styles.tileIcon, { backgroundColor: "rgba(0, 200, 83, 0.12)" }]}>
                    <Ionicons name="arrow-down" size={16} color="#00C853" />
                  </View>
                  <Text style={styles.tileLabel}>Income</Text>
                </View>
                <Text style={styles.tileAmount}>
                  ${monthlyIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.summaryTile}>
                <View style={styles.tileIconRow}>
                  <View style={[styles.tileIcon, { backgroundColor: "rgba(255, 59, 48, 0.12)" }]}>
                    <Ionicons name="arrow-up" size={16} color="#FF3B30" />
                  </View>
                  <Text style={styles.tileLabel}>Expenses</Text>
                </View>
                <Text style={styles.tileAmount}>
                  ${monthlyExpense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/add-transaction")} activeOpacity={0.85}>
              <Ionicons name="add-circle-outline" size={20} color="#0B1519" style={{ marginRight: 8 }} />
              <Text style={styles.addButtonText}>+ Add Transaction</Text>
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>TRANSACTIONS</Text>
            </View>

            {monthlyTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No transactions this month.</Text>
              </View>
            ) : (
              monthlyTransactions.map((tx) => {
                const cat = categoryMap.get(tx.category_id);
                const dateLabel = new Date(tx.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={styles.txLeft}>
                      <View style={styles.txIconBox}>
                        <Text style={styles.txEmoji}>{cat?.icon ?? "💳"}</Text>
                      </View>
                      <View>
                        <Text style={styles.txName}>{tx.note || cat?.name || "Transaction"}</Text>
                        <Text style={styles.txMeta}>{dateLabel} · {cat?.name ?? "—"}</Text>
                      </View>
                    </View>
                    <Text style={[styles.txAmount, tx.type === "expense" ? styles.expenseColor : styles.incomeColor]}>
                      {tx.type === "expense" ? "-" : "+"}${tx.amount.toFixed(2)}
                    </Text>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── SUMMARY ──────────────────────────────────────────── */}
        {activeTab === "Summary" && (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryTile}>
                <View style={styles.tileIconRow}>
                  <View style={[styles.tileIcon, { backgroundColor: "rgba(0, 200, 83, 0.12)" }]}>
                    <Ionicons name="arrow-down" size={16} color="#00C853" />
                  </View>
                  <Text style={styles.tileLabel}>Income</Text>
                </View>
                <Text style={styles.tileAmount}>
                  ${monthlyIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.summaryTile}>
                <View style={styles.tileIconRow}>
                  <View style={[styles.tileIcon, { backgroundColor: "rgba(255, 59, 48, 0.12)" }]}>
                    <Ionicons name="arrow-up" size={16} color="#FF3B30" />
                  </View>
                  <Text style={styles.tileLabel}>Expenses</Text>
                </View>
                <Text style={styles.tileAmount}>
                  ${monthlyExpense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    chartConfig={CHART_CONFIG}
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
                      <View style={[styles.progressFill, { width: `${summaryExpenseTotal > 0 ? (c.total / summaryExpenseTotal) * 100 : 0}%` as any }]} />
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1519", paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  dateLabel: { color: "#fff", fontSize: 22, fontWeight: "700" },
  headerIcons: { flexDirection: "row" },

  navRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  navLabel: { color: "#fff", fontSize: 17, fontWeight: "700", marginHorizontal: 24 },

  tabsRow: { flexDirection: "row", marginBottom: 25 },
  tabItem: { flex: 1, alignItems: "center" },
  tabText: { color: "#7A869A", fontSize: 14, fontWeight: "500" },
  tabTextActive: { color: "#fff" },
  tabUnderline: { marginTop: 8, height: 3, width: 28, backgroundColor: "#00D4FF", borderRadius: 2 },

  balanceCard: {
    backgroundColor: "#00D4FF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  balanceLabel: { color: "rgba(0,0,0,0.6)", fontSize: 14, fontWeight: "500" },
  balanceAmount: { color: "#0B1519", fontSize: 36, fontWeight: "800", marginVertical: 8 },
  cardRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  cardText: { color: "rgba(0,0,0,0.6)", fontSize: 13, marginLeft: 6 },

  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  summaryTile: { flex: 0.48, backgroundColor: "#1C252E", borderRadius: 20, padding: 16 },
  tileIconRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  tileIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center", marginRight: 8 },
  tileLabel: { color: "#7A869A", fontSize: 13, fontWeight: "500" },
  tileAmount: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 4 },

  sectionLabel: { color: "#7A869A", fontSize: 12, fontWeight: "800", letterSpacing: 1, marginBottom: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 12,
  },

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

  emptyState: {
    backgroundColor: "#1C252E",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyText: { color: "#7A869A", fontSize: 14 },

  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1C252E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  txLeft: { flexDirection: "row", alignItems: "center" },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#0B1519",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txEmoji: { fontSize: 20 },
  txName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  txMeta: { color: "#7A869A", fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: "700" },
  incomeColor: { color: "#00C853" },
  expenseColor: { color: "#FF3B30" },

  // Calendar
  calWeekRow: { flexDirection: "row", marginBottom: 6 },
  calWeekLabel: { width: "14.28%", textAlign: "center", color: "#7A869A", fontSize: 12, fontWeight: "600" },
  calGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  calCell: { width: "14.28%", height: 44, alignItems: "center", justifyContent: "center" },
  calCellSelected: { backgroundColor: "#00D4FF", borderRadius: 10 },
  calDayText: { color: "#fff", fontSize: 14 },
  calDayToday: { color: "#00D4FF", fontWeight: "700" },
  calDaySelected: { color: "#0B1519", fontWeight: "700" },
  calDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#00D4FF", marginTop: 2 },

  // Summary
  chart: { borderRadius: 16, marginBottom: 20 },
  catRow: { backgroundColor: "#1C252E", borderRadius: 16, padding: 16, marginBottom: 10 },
  catRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  catName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  catAmount: { color: "#fff", fontSize: 14, fontWeight: "700" },
  progressBg: { height: 6, backgroundColor: "#0B1519", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: "#00D4FF", borderRadius: 3 },
});
