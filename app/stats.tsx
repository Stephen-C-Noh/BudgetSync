import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const TOP_TABS = ["Overview", "Expenses", "Income"] as const;
const MONTHS = ["October 2023", "September", "August"] as const;

const SPENDING_DATA = [
  { label: "Housing", amount: "$1,200.00", color: "#21C8F6" },
  { label: "Food & Dining", amount: "$840.50", color: "#7A6CFF" },
  { label: "Transport", amount: "$450.00", color: "#4CD6B8" },
  { label: "Shopping", amount: "$320.00", color: "#F3C94D" },
];

const COLORS = {
  background: "#071420",
  card: "#0C1C2B",
  border: "#132A3A",
  muted: "#7890A3",
  secondaryText: "#8EA4B5",
  white: "#FFFFFF",
  accent: "#00D1FF",
  chip: "#122433",
  chipActive: "#1C9DFF",
  success: "#2BE38B",
  progressTrack: "#163246",
  legendText: "#C8D4DE",
  weekText: "#A2B4C3",
  smallText: "#6E8596",
};

export default function StatsScreen() {
  const [activeTopTab, setActiveTopTab] =
    useState<(typeof TOP_TABS)[number]>("Expenses");
  const [activeMonth, setActiveMonth] =
    useState<(typeof MONTHS)[number]>("October 2023");

  const chart = useMemo(() => {
    const radius = 72;
    const strokeWidth = 16;
    const size = 190;
    const circumference = 2 * Math.PI * radius;
    const progress = 0.82;
    const strokeDashoffset = circumference - circumference * progress;

    return {
      radius,
      strokeWidth,
      size,
      circumference,
      strokeDashoffset,
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Stats</Text>

        <View style={styles.topTabs}>
          {TOP_TABS.map((tab) => {
            const isActive = activeTopTab === tab;

            return (
              <TouchableOpacity
                key={tab}
                style={styles.topTabButton}
                onPress={() => setActiveTopTab(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.topTabText,
                    isActive && styles.topTabTextActive,
                  ]}
                >
                  {tab}
                </Text>

                {isActive && <View style={styles.topTabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.monthRow}>
          {MONTHS.map((month) => {
            const isActive = activeMonth === month;

            return (
              <TouchableOpacity
                key={month}
                style={[styles.monthChip, isActive && styles.monthChipActive]}
                onPress={() => setActiveMonth(month)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.monthChipText,
                    isActive && styles.monthChipTextActive,
                  ]}
                >
                  {month}
                </Text>

                {isActive && (
                  <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spending</Text>
            <Text style={styles.summaryValue}>$3,240.50</Text>
            <Text style={styles.summaryGrowth}>+12% vs last month</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Monthly Budget</Text>
            <Text style={styles.summaryValue}>$4,000.00</Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending Breakdown</Text>

          <View style={styles.chartContainer}>
            <View style={styles.chartWrapper}>
              <Svg width={chart.size} height={chart.size}>
                <Circle
                  stroke={COLORS.progressTrack}
                  fill="none"
                  cx={chart.size / 2}
                  cy={chart.size / 2}
                  r={chart.radius}
                  strokeWidth={chart.strokeWidth}
                />
                <Circle
                  stroke="#21C8F6"
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
                <Text
                  style={styles.chartCenterValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  Housing
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.legendList}>
            {SPENDING_DATA.map((item) => (
              <View key={item.label} style={styles.legendRow}>
                <View style={styles.legendLeft}>
                  <View
                    style={[styles.legendDot, { backgroundColor: item.color }]}
                  />
                  <Text style={styles.legendText}>{item.label}</Text>
                </View>
                <Text style={styles.legendAmount}>{item.amount}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.weekHeader}>
            <Text style={styles.cardTitle}>Weekly Trends</Text>
            <Text style={styles.weekSubtext}>Last 4 Weeks</Text>
          </View>

          <View style={styles.weekChart}>
            <View style={styles.weekColumn}>
              <View style={[styles.bar, { height: 38 }]} />
              <Text style={styles.weekLabel}>W1</Text>
            </View>

            <View style={styles.weekColumn}>
              <View style={[styles.bar, { height: 62 }]} />
              <Text style={styles.weekLabel}>W2</Text>
            </View>

            <View style={styles.weekColumn}>
              <View style={[styles.bar, { height: 48 }]} />
              <Text style={styles.weekLabel}>W3</Text>
            </View>

            <View style={styles.weekColumn}>
              <View style={[styles.bar, { height: 72 }]} />
              <Text style={styles.weekLabel}>W4</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 18,
  },

  topTabs: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 16,
  },
  topTabButton: {
    alignItems: "center",
    paddingBottom: 2,
  },
  topTabText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "500",
  },
  topTabTextActive: {
    color: COLORS.accent,
    fontWeight: "700",
  },
  topTabUnderline: {
    width: "100%",
    height: 2,
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },

  monthRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  monthChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.chip,
  },
  monthChipActive: {
    backgroundColor: COLORS.chipActive,
  },
  monthChipText: {
    color: "#AFC2D3",
    fontSize: 12,
    fontWeight: "600",
  },
  monthChipTextActive: {
    color: COLORS.white,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  summaryLabel: {
    color: COLORS.secondaryText,
    fontSize: 12,
    marginBottom: 8,
  },
  summaryValue: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  summaryGrowth: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "600",
  },
  progressTrack: {
    height: 8,
    marginTop: 8,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: COLORS.progressTrack,
  },
  progressFill: {
    width: "81%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#22C8F6",
  },

  card: {
    padding: 16,
    marginBottom: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },

  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 22,
  },
  chartWrapper: {
    width: 190,
    height: 190,
    alignItems: "center",
    justifyContent: "center",
  },
  chartCenter: {
    position: "absolute",
    width: 118,
    alignItems: "center",
    justifyContent: "center",
  },
  chartCenterLabel: {
    color: "#738A9B",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  chartCenterValue: {
    maxWidth: 110,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  legendList: {
    gap: 12,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 10,
  },
  legendText: {
    color: COLORS.legendText,
    fontSize: 14,
  },
  legendAmount: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },

  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weekSubtext: {
    color: COLORS.smallText,
    fontSize: 12,
  },
  weekChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    marginTop: 10,
    paddingHorizontal: 8,
  },
  weekColumn: {
    alignItems: "center",
  },
  bar: {
    width: 24,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#21C8F6",
  },
  weekLabel: {
    color: COLORS.weekText,
    fontSize: 12,
  },
});