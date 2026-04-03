import { Ionicons } from "@expo/vector-icons";
import { useAppState } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/context/ThemeContext";
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
import CalendarView from "@/components/shared/CalendarView";
import DailyView from "@/components/shared/DailyView";
import AccountsMonthlyView from "@/components/accounts/MonthlyView";
import AccountsSummaryView from "@/components/accounts/SummaryView";

const TABS = ["Daily", "Calendar", "Monthly", "Summary"];

export default function AccountsScreen() {
  const { accounts, transactions, categories, isLoading } = useAppState();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState("Monthly");
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>Accounts</Text>
          <View style={styles.headerRight}>
            <Ionicons name="search-outline" size={22} color={colors.textPrimary} style={{ marginRight: 18 }} />
            <Ionicons name="star-outline" size={22} color={colors.textPrimary} style={{ marginRight: 18 }} />
            <Ionicons name="options-outline" size={22} color={colors.textPrimary} />
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

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
    headerTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
      marginBottom: 20,
    },
    title: { color: colors.textPrimary, fontSize: 22, fontWeight: "700" },
    headerRight: { flexDirection: "row" },
    tabsRow: { flexDirection: "row", marginBottom: 25 },
    tab: { flex: 1, alignItems: "center" },
    tabText: { color: colors.textSecondary, fontSize: 14, fontWeight: "500" },
    activeTabText: { color: colors.textPrimary },
    activeIndicator: { marginTop: 8, height: 3, width: 28, backgroundColor: colors.accent, borderRadius: 2 },
  });
}
