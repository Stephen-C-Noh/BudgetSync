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
import HomeMonthlyView from "@/components/home/MonthlyView";
import HomeSummaryView from "@/components/home/SummaryView";

const TABS = ["Daily", "Calendar", "Monthly", "Summary"];

export default function TodayScreen() {
  const { accounts, transactions, categories, isLoading } = useAppState();
  const [activeTab, setActiveTab] = useState("Monthly");

  const today = new Date();
  const todayDisplay = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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
        <View style={styles.header}>
          <Text style={styles.dateLabel}>{todayDisplay}</Text>
          <View style={styles.headerIcons}>
            <Ionicons name="search-outline" size={22} color="#fff" style={{ marginRight: 18 }} />
            <Ionicons name="star-outline" size={22} color="#fff" style={{ marginRight: 18 }} />
            <Ionicons name="options-outline" size={22} color="#fff" />
          </View>
        </View>

        <View style={styles.tabsRow}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              {activeTab === tab && <View style={styles.tabUnderline} />}
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
          <HomeMonthlyView accounts={accounts} transactions={transactions} categories={categories} />
        )}
        {activeTab === "Summary" && (
          <HomeSummaryView transactions={transactions} categories={categories} />
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
  tabsRow: { flexDirection: "row", marginBottom: 25 },
  tabItem: { flex: 1, alignItems: "center" },
  tabText: { color: "#7A869A", fontSize: 14, fontWeight: "500" },
  tabTextActive: { color: "#fff" },
  tabUnderline: { marginTop: 8, height: 3, width: 28, backgroundColor: "#00D4FF", borderRadius: 2 },
});
