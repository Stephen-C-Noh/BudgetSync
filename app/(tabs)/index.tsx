import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppState } from "@/context/AppContext";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VIEW_TABS = ["Daily", "Calendar", "Monthly", "Summary", "Description"];

export default function TodayScreen() {
  const router = useRouter();
  const { accounts, transactions, categories, isLoading } = useAppState();
  const [activeTab, setActiveTab] = useState("Monthly");
  const [year, setYear] = useState(new Date().getFullYear());

  const today = new Date()
    .toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })
    .replace("/", "-");

  const currentMonth = new Date().getMonth(); // 0-indexed

  // Total balance across all accounts
  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );

  const primaryAccount = accounts[0] ?? null;

  // Category lookup map
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Monthly income / expense for current month + year
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      const d = new Date(tx.date);
      if (d.getFullYear() === year && d.getMonth() === currentMonth) {
        if (tx.type === "income") income += tx.amount;
        else expense += tx.amount;
      }
    }
    return { monthlyIncome: income, monthlyExpense: expense };
  }, [transactions, year, currentMonth]);

  // Recent 5 transactions
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

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
          <Text style={styles.dateLabel}>{today}</Text>
          <View style={styles.headerIcons}>
            <Ionicons name="search-outline" size={22} color="#fff" style={{ marginRight: 18 }} />
            <Ionicons name="star-outline" size={22} color="#fff" style={{ marginRight: 18 }} />
            <Ionicons name="options-outline" size={22} color="#fff" />
          </View>
        </View>

        {/* Year navigation */}
        <View style={styles.yearRow}>
          <TouchableOpacity onPress={() => setYear(year - 1)}>
            <Ionicons name="chevron-back" size={20} color="#A7B1C2" />
          </TouchableOpacity>
          <Text style={styles.year}>{year}</Text>
          <TouchableOpacity onPress={() => setYear(year + 1)}>
            <Ionicons name="chevron-forward" size={20} color="#A7B1C2" />
          </TouchableOpacity>
        </View>

        {/* View mode tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {VIEW_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tabItem}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Balance card */}
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

        {/* Income / Expense summary tiles */}
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

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/add-transaction")}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={20} color="#0B1519" style={{ marginRight: 8 }} />
          <Text style={styles.addButtonText}>+ Add Transaction</Text>
        </TouchableOpacity>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>RECENT TRANSACTIONS</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet. Add one above!</Text>
          </View>
        ) : (
          recentTransactions.map((tx) => {
            const cat = categoryMap.get(tx.category_id);
            const timeLabel = (() => {
              const txDate = new Date(tx.date);
              const now = new Date();
              const diffDays = Math.floor((now.getTime() - txDate.getTime()) / 86400000);
              if (diffDays === 0) return new Date(tx.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              if (diffDays === 1) return "Yesterday";
              return txDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            })();

            return (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txLeft}>
                  <View style={styles.txIconBox}>
                    <Text style={styles.txEmoji}>{cat?.icon ?? "💳"}</Text>
                  </View>
                  <View>
                    <Text style={styles.txName}>{tx.note || cat?.name || "Transaction"}</Text>
                    <Text style={styles.txMeta}>{timeLabel} · {cat?.name ?? "—"}</Text>
                  </View>
                </View>
                <Text style={[styles.txAmount, tx.type === "expense" ? styles.expenseColor : styles.incomeColor]}>
                  {tx.type === "expense" ? "-" : "+"}${tx.amount.toFixed(2)}
                </Text>
              </View>
            );
          })
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

  yearRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  year: { color: "#fff", fontSize: 18, fontWeight: "700", marginHorizontal: 30 },

  tabsScroll: { marginBottom: 25 },
  tabItem: { marginRight: 25, alignItems: "center" },
  tabText: { color: "#7A869A", fontSize: 16, fontWeight: "500" },
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
  seeAll: { color: "#00D4FF", fontSize: 13, fontWeight: "600" },

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
});
