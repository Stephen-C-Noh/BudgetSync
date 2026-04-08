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

import HomeMonthlyView from "@/components/home/MonthlyView";

import HomeSummaryView from "@/components/home/SummaryView";

const TABS = ["Daily", "Calendar", "Monthly", "Summary"];

export default function TodayScreen() {

  const { accounts, transactions, categories, isLoading } = useAppState();

  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState("Monthly");

  const [showStarred, setShowStarred] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const today = new Date();

  const todayDisplay = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(

    today.getDate()

  ).padStart(2, "0")}`;

  const visibleTransactions = useMemo(() => {

    if (!showStarred) return transactions;

    return transactions.filter((tx) => tx.starred === 1);

  }, [transactions, showStarred]);

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
<View style={styles.header}>
<Text style={styles.dateLabel}>{todayDisplay}</Text>
<View style={styles.headerIcons}>
<Ionicons

              name="search-outline"

              size={22}

              color={colors.textPrimary}

              style={{ marginRight: 18 }}

            />
<TouchableOpacity

              onPress={() => setShowStarred((prev) => !prev)}

              style={styles.iconButton}

              activeOpacity={0.7}
>
<Ionicons

                name={showStarred ? "star" : "star-outline"}

                size={22}

                color={showStarred ? colors.accent : colors.textPrimary}

                style={{ marginRight: 18 }}

              />
</TouchableOpacity>
<Ionicons

              name="options-outline"

              size={22}

              color={colors.textPrimary}

            />
</View>
</View>

        {showStarred && (
<Text style={styles.filterLabel}>Showing starred transactions</Text>

        )}
<View style={styles.tabsRow}>

          {TABS.map((tab) => (
<TouchableOpacity

              key={tab}

              onPress={() => setActiveTab(tab)}

              style={styles.tabItem}
>
<Text

                style={[

                  styles.tabText,

                  activeTab === tab && styles.tabTextActive,

                ]}
>

                {tab}
</Text>

              {activeTab === tab && <View style={styles.tabUnderline} />}
</TouchableOpacity>

          ))}
</View>

        {activeTab === "Daily" && (
<DailyView transactions={visibleTransactions} categories={categories} />

        )}

        {activeTab === "Calendar" && (
<CalendarView

            transactions={visibleTransactions}

            categories={categories}

          />

        )}

        {activeTab === "Monthly" && (
<HomeMonthlyView

            accounts={accounts}

            transactions={visibleTransactions}

            categories={categories}

          />

        )}

        {activeTab === "Summary" && (
<HomeSummaryView

            transactions={visibleTransactions}

            categories={categories}

          />

        )}
<View style={{ height: 30 }} />
</ScrollView>
</SafeAreaView>

  );

}

function createStyles(colors: Colors) {

  return StyleSheet.create({

    container: {

      flex: 1,

      backgroundColor: colors.background,

      paddingHorizontal: 20,

    },

    header: {

      flexDirection: "row",

      justifyContent: "space-between",

      alignItems: "center",

      marginTop: 10,

      marginBottom: 20,

    },

    dateLabel: {

      color: colors.textPrimary,

      fontSize: 22,

      fontWeight: "700",

    },

    headerIcons: {

      flexDirection: "row",

      alignItems: "center",

    },

    iconButton: {

      alignItems: "center",

      justifyContent: "center",

    },

    filterLabel: {

      color: colors.accent,

      fontSize: 12,

      fontWeight: "600",

      marginBottom: 12,

    },

    tabsRow: {

      flexDirection: "row",

      marginBottom: 25,

    },

    tabItem: {

      flex: 1,

      alignItems: "center",

    },

    tabText: {

      color: colors.textSecondary,

      fontSize: 14,

      fontWeight: "500",

    },

    tabTextActive: {

      color: colors.textPrimary,

    },

    tabUnderline: {

      marginTop: 8,

      height: 3,

      width: 28,

      backgroundColor: colors.accent,

      borderRadius: 2,

    },

  });

}
 