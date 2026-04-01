import { Ionicons } from "@expo/vector-icons";
import { useAppState } from "@/context/AppContext";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CalendarView from "@/components/shared/CalendarView";
import DailyView from "@/components/shared/DailyView";
import AccountsMonthlyView from "@/components/accounts/MonthlyView";
import AccountsSummaryView from "@/components/accounts/SummaryView";

const TABS = ["Daily", "Calendar", "Monthly", "Summary"];

export default function AccountsScreen() {
  const { accounts, transactions, categories, isLoading } = useAppState();
  const [activeTab, setActiveTab] = useState("Monthly");

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
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>Accounts</Text>
          <View style={styles.headerRight}>
            <Ionicons name="search-outline" size={22} color="#fff" style={{ marginRight: 18 }} />
            <Ionicons name="star-outline" size={22} color="#fff" style={{ marginRight: 18 }} />
            <Ionicons name="options-outline" size={22} color="#fff" />
          </View>
        </View>

        <View style={styles.tabsRow}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              {activeTab === tab && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "Daily" && (
          <DailyView transactions={transactions} categories={categories} />
        )}
        {activeTab === "Calendar" && (
          <CalendarView transactions={transactions} categories={categories} />
        )}
        {activeTab === "Monthly" && (
          <AccountsMonthlyView accounts={accounts} />
        )}
        {activeTab === "Summary" && (
          <AccountsSummaryView accounts={accounts} transactions={transactions} categories={categories} />
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
  tabsRow: { flexDirection: "row", marginBottom: 25 },
  tab: { flex: 1, alignItems: "center" },
  tabText: { color: "#7A869A", fontSize: 14, fontWeight: "500" },
  activeTabText: { color: "#fff" },
  activeIndicator: { marginTop: 8, height: 3, width: 28, backgroundColor: "#00D4FF", borderRadius: 2 },
});
