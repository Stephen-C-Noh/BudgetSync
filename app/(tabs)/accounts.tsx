import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppState } from "@/context/AppContext";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCOUNT_TYPE_META: Record<string, { label: string; sub: string; iconName: string; iconColor: string; bgColor: string }> = {
  bank:        { label: "Cash & Bank",   sub: "Checking, Savings", iconName: "wallet-outline",  iconColor: "#5BA4FC", bgColor: "#1A2E44" },
  cash:        { label: "Cash & Bank",   sub: "Cash on hand",      iconName: "wallet-outline",  iconColor: "#5BA4FC", bgColor: "#1A2E44" },
  investment:  { label: "Investments",   sub: "Stocks, Crypto",    iconName: "trending-up",     iconColor: "#A37CFF", bgColor: "#2A244D" },
  credit_card: { label: "Credit Cards",  sub: "Credit",            iconName: "credit-card",     iconColor: "#FF7C7C", bgColor: "#3D242B" },
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

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

export default function AccountsScreen() {
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

  const tabs = ["Daily", "Calendar", "Monthly", "Summary"];
  const currentMonth = new Date().getMonth();

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const { netWorth, assets, liabilities } = useMemo(() => {
    let assets = 0;
    let liabilities = 0;
    for (const a of accounts) {
      if (a.type === "credit_card") liabilities += Math.abs(a.balance);
      else assets += a.balance;
    }
    return { netWorth: assets - liabilities, assets, liabilities };
  }, [accounts]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof accounts> = {};
    for (const a of accounts) {
      const key = a.type === "cash" ? "bank" : a.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    }
    return groups;
  }, [accounts]);

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
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>Accounts</Text>
          <View style={styles.headerRight}>
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

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {tabs.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              {activeTab === tab && <View style={styles.activeIndicator} />}
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

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>TRANSACTIONS</Text>
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
                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{calSelected}</Text>
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
            <View style={styles.netWorthCard}>
              <Text style={styles.netWorthLabel}>Net Worth</Text>
              <Text style={styles.netWorthValue}>
                ${netWorth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <View style={styles.tagsRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{accounts.length} Account{accounts.length !== 1 ? "s" : ""}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Updated Today</Text>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.box}>
                <View style={styles.boxHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: "rgba(42, 211, 0, 0.1)" }]}>
                    <MaterialCommunityIcons name="bank" size={18} color="#2AD300" />
                  </View>
                  <Text style={styles.boxTitle}>Assets</Text>
                </View>
                <Text style={styles.boxValue}>
                  ${assets.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={styles.greenText}>Total Value</Text>
              </View>

              <View style={styles.box}>
                <View style={styles.boxHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: "rgba(255, 77, 77, 0.1)" }]}>
                    <MaterialCommunityIcons name="credit-card-off" size={18} color="#FF4D4D" />
                  </View>
                  <Text style={styles.boxTitle}>Liabilities</Text>
                </View>
                <Text style={styles.boxValue}>
                  ${liabilities.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={styles.redText}>Total Debt</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>ACCOUNT BREAKDOWN</Text>
            {accounts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No accounts yet.</Text>
              </View>
            ) : (
              Object.entries(grouped).map(([type, accs]) => {
                const meta = ACCOUNT_TYPE_META[type] ?? ACCOUNT_TYPE_META.bank;
                const groupBalance = accs.reduce((s, a) => s + a.balance, 0);
                const isCredit = type === "credit_card";
                return (
                  <View key={type} style={styles.accountItem}>
                    <View style={styles.accountLeft}>
                      <View style={[styles.logoBox, { backgroundColor: meta.bgColor }]}>
                        <MaterialCommunityIcons name={meta.iconName as any} size={24} color={meta.iconColor} />
                      </View>
                      <View>
                        <Text style={styles.accountName}>{meta.label}</Text>
                        <Text style={styles.accountSub}>{accs.map((a) => a.name).join(", ")}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[styles.accountValue, isCredit && { color: "#FF4D4D" }]}>
                        {isCredit ? "-" : ""}${Math.abs(groupBalance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                      <Text style={isCredit ? styles.accountTagRed : styles.accountTagGreen}>
                        {isCredit ? "Credit" : "Stable"}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── SUMMARY ──────────────────────────────────────────── */}
        {activeTab === "Summary" && (
          <>
            <View style={styles.summaryTilesRow}>
              <View style={styles.summaryTile3}>
                <Text style={styles.tile3Label}>NET WORTH</Text>
                <Text style={[styles.tile3Value, { color: "#00D4FF" }]}>
                  ${netWorth.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
              </View>
              <View style={styles.summaryTile3}>
                <Text style={styles.tile3Label}>ASSETS</Text>
                <Text style={[styles.tile3Value, { color: "#2AD300" }]}>
                  ${assets.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
              </View>
              <View style={styles.summaryTile3}>
                <Text style={styles.tile3Label}>LIABILITIES</Text>
                <Text style={[styles.tile3Value, { color: "#FF4D4D" }]}>
                  ${liabilities.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
                    <Text style={styles.catAmount}>${c.total.toFixed(2)}</Text>
                  </View>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${summaryExpenseTotal > 0 ? (c.total / summaryExpenseTotal) * 100 : 0}%` as any }]} />
                  </View>
                </View>
              ))
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

  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  headerRight: { flexDirection: "row" },

  navRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  navLabel: { color: "#fff", fontSize: 17, fontWeight: "700", marginHorizontal: 24 },

  tabsRow: { flexDirection: "row", marginBottom: 25 },
  tab: { flex: 1, alignItems: "center" },
  tabText: { color: "#7A869A", fontSize: 14, fontWeight: "500" },
  activeTabText: { color: "#fff" },
  activeIndicator: { marginTop: 8, height: 3, width: 28, backgroundColor: "#00D4FF", borderRadius: 2 },

  // Monthly: net worth card
  netWorthCard: { backgroundColor: "#00D9FF", borderRadius: 24, padding: 24, marginBottom: 25 },
  netWorthLabel: { color: "#0B1519", fontSize: 14, fontWeight: "500", opacity: 0.7 },
  netWorthValue: { color: "#0B1519", fontSize: 36, fontWeight: "800", marginVertical: 8 },
  tagsRow: { flexDirection: "row", marginTop: 10 },
  tag: {
    backgroundColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 10,
  },
  tagText: { color: "#0B1519", fontSize: 12, fontWeight: "600" },

  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  box: { flex: 0.48, backgroundColor: "#1C252E", padding: 16, borderRadius: 20 },
  boxHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 10 },
  boxTitle: { color: "#7A869A", fontSize: 14, fontWeight: "500" },
  boxValue: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  greenText: { color: "#2AD300", fontSize: 13 },
  redText: { color: "#FF4D4D", fontSize: 13 },

  sectionTitle: { color: "#fff", marginBottom: 15, fontSize: 13, fontWeight: "800", letterSpacing: 1 },

  accountItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1C252E",
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
  },
  accountLeft: { flexDirection: "row", alignItems: "center" },
  logoBox: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 14 },
  accountName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  accountSub: { color: "#7A869A", fontSize: 13, marginTop: 2 },
  accountValue: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 2 },
  accountTagGreen: { color: "#2AD300", fontSize: 11 },
  accountTagRed: { color: "#FF4D4D", fontSize: 11 },

  emptyState: { backgroundColor: "#1C252E", borderRadius: 16, padding: 24, alignItems: "center" },
  emptyText: { color: "#7A869A", fontSize: 14 },

  // Daily / Calendar: transaction rows
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
  summaryTilesRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  summaryTile3: { flex: 0.31, backgroundColor: "#1C252E", borderRadius: 20, padding: 14, alignItems: "center" },
  tile3Label: { color: "#7A869A", fontSize: 10, fontWeight: "700", letterSpacing: 0.5, marginBottom: 6 },
  tile3Value: { color: "#fff", fontSize: 16, fontWeight: "700" },

  catRow: { backgroundColor: "#1C252E", borderRadius: 16, padding: 16, marginBottom: 10 },
  catRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  catName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  catAmount: { color: "#fff", fontSize: 14, fontWeight: "700" },
  progressBg: { height: 6, backgroundColor: "#0B1519", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: "#00D4FF", borderRadius: 3 },
});
