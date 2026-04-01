import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppState } from "@/context/AppContext";
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

export default function AccountsScreen() {
  const { accounts, isLoading } = useAppState();
  const [activeTab, setActiveTab] = useState("Monthly");
  const [year, setYear] = useState(new Date().getFullYear());

  const tabs = ["Daily", "Calendar", "Monthly", "Summary", "Description"];

  const { netWorth, assets, liabilities } = useMemo(() => {
    let assets = 0;
    let liabilities = 0;
    for (const a of accounts) {
      if (a.type === "credit_card") liabilities += Math.abs(a.balance);
      else assets += a.balance;
    }
    return { netWorth: assets - liabilities, assets, liabilities };
  }, [accounts]);

  // Group accounts by display type
  const grouped = useMemo(() => {
    const groups: Record<string, typeof accounts> = {};
    for (const a of accounts) {
      const key = a.type === "cash" ? "bank" : a.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    }
    return groups;
  }, [accounts]);

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

        {/* Year */}
        <View style={styles.yearContainer}>
          <TouchableOpacity onPress={() => setYear(year - 1)}>
            <Ionicons name="chevron-back" size={20} color="#A7B1C2" />
          </TouchableOpacity>
          <Text style={styles.year}>{year}</Text>
          <TouchableOpacity onPress={() => setYear(year + 1)}>
            <Ionicons name="chevron-forward" size={20} color="#A7B1C2" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              {activeTab === tab && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Net Worth card */}
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

        {/* Assets & Liabilities */}
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

        {/* Account breakdown */}
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

  yearContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  year: { color: "#fff", fontSize: 18, fontWeight: "700", marginHorizontal: 30 },

  tabs: { marginBottom: 25 },
  tab: { marginRight: 25, alignItems: "center" },
  tabText: { color: "#7A869A", fontSize: 16, fontWeight: "500" },
  activeTabText: { color: "#fff" },
  activeIndicator: { marginTop: 8, height: 3, width: 28, backgroundColor: "#00D4FF", borderRadius: 2 },

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

  emptyState: { backgroundColor: "#1C252E", borderRadius: 16, padding: 24, alignItems: "center" },
  emptyText: { color: "#7A869A", fontSize: 14 },

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
});
