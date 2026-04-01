import { Ionicons } from "@expo/vector-icons";
import { useAppActions, useAppState } from "@/context/AppContext";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BudgetGoalsScreen() {
  const router = useRouter();
  const { budgetGoals, categories, transactions, isLoading } = useAppState();
  const { deleteBudgetGoal } = useAppActions();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const monthlySpentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      const d = new Date(tx.date);
      if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) continue;
      map[tx.category_id] = (map[tx.category_id] ?? 0) + tx.amount;
    }
    return map;
  }, [transactions, currentYear, currentMonth]);

  const monthlyGoals = useMemo(
    () => budgetGoals.filter((g) => g.period === "monthly"),
    [budgetGoals]
  );

  const totalBudget = useMemo(
    () => monthlyGoals.reduce((sum, g) => sum + g.limit_amount, 0),
    [monthlyGoals]
  );

  const totalSpent = useMemo(
    () => monthlyGoals.reduce((sum, g) => sum + (monthlySpentByCategory[g.category_id] ?? 0), 0),
    [monthlyGoals, monthlySpentByCategory]
  );

  function handleDelete(id: string) {
    Alert.alert("Remove Goal", "Remove this budget goal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => deleteBudgetGoal(id),
      },
    ]);
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
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15, paddingRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#00D9FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget Goals</Text>
        <View style={{ width: 24, marginRight: 15 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Monthly summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Monthly Budget</Text>
          <Text style={styles.summaryTotal}>${totalBudget.toLocaleString()}</Text>
          {totalBudget > 0 ? (
            <>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` as any,
                      backgroundColor: totalSpent > totalBudget ? "#FF3B30" : "#00D4FF",
                    },
                  ]}
                />
              </View>
              <View style={styles.summaryFooter}>
                <Text style={styles.summaryMuted}>Spent: ${totalSpent.toLocaleString()}</Text>
                <Text style={styles.summaryMuted}>
                  Remaining: ${Math.max(totalBudget - totalSpent, 0).toLocaleString()}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.summaryMuted}>No monthly goals set</Text>
          )}
        </View>

        <Text style={styles.sectionLabel}>CATEGORY GOALS</Text>

        <View style={styles.card}>
          {monthlyGoals.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No budget goals yet.</Text>
            </View>
          ) : (
            monthlyGoals.map((goal, index) => {
              const cat = categoryMap.get(goal.category_id);
              const spent = monthlySpentByCategory[goal.category_id] ?? 0;
              const pct = Math.min((spent / goal.limit_amount) * 100, 100);
              const isOver = spent > goal.limit_amount;

              return (
                <View key={goal.id}>
                  <View style={styles.goalRow}>
                    <View style={styles.goalLeft}>
                      <View style={styles.iconBox}>
                        <Text style={styles.goalEmoji}>{cat?.icon ?? "📦"}</Text>
                      </View>
                      <View style={styles.goalInfo}>
                        <View style={styles.goalTitleRow}>
                          <Text style={styles.goalCategory}>{cat?.name ?? "Unknown"}</Text>
                          {isOver && (
                            <View style={styles.overBadge}>
                              <Text style={styles.overBadgeText}>OVER</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.goalBarTrack}>
                          <View
                            style={[
                              styles.goalBarFill,
                              { width: `${pct}%` as any, backgroundColor: isOver ? "#FF3B30" : "#00D4FF" },
                            ]}
                          />
                        </View>
                        <Text style={styles.goalAmounts}>
                          ${spent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${goal.limit_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(goal.id)}>
                      <Ionicons name="trash-outline" size={18} color="#FF4D4D" />
                    </TouchableOpacity>
                  </View>
                  {index < monthlyGoals.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          )}
        </View>

        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add-circle-outline" size={20} color="#0B1519" style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Add Budget Goal</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1519" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  scroll: { paddingHorizontal: 20 },

  summaryCard: {
    backgroundColor: "#1C252E",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  summaryLabel: { color: "#7A869A", fontSize: 13, fontWeight: "600", marginBottom: 6 },
  summaryTotal: { color: "#FFF", fontSize: 32, fontWeight: "800", marginBottom: 14 },
  progressTrack: { height: 8, backgroundColor: "#0B1519", borderRadius: 999, overflow: "hidden", marginBottom: 10 },
  progressFill: { height: "100%", borderRadius: 999 },
  summaryFooter: { flexDirection: "row", justifyContent: "space-between" },
  summaryMuted: { color: "#7A869A", fontSize: 12 },

  sectionLabel: { color: "#7A869A", fontSize: 12, fontWeight: "800", letterSpacing: 1, marginBottom: 12 },

  card: { backgroundColor: "#1C252E", borderRadius: 20, overflow: "hidden", marginBottom: 16 },

  emptyRow: { padding: 20, alignItems: "center" },
  emptyText: { color: "#7A869A", fontSize: 14 },

  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  goalLeft: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#0B1519",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  goalEmoji: { fontSize: 20 },
  goalInfo: { flex: 1 },
  goalTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  goalCategory: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  overBadge: {
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  overBadgeText: { color: "#FF3B30", fontSize: 9, fontWeight: "800" },
  goalBarTrack: { height: 5, backgroundColor: "#0B1519", borderRadius: 999, overflow: "hidden", marginBottom: 5 },
  goalBarFill: { height: "100%", borderRadius: 999 },
  goalAmounts: { color: "#7A869A", fontSize: 11 },
  divider: { height: 1, backgroundColor: "#2A333D", marginHorizontal: 16 },

  addBtn: {
    backgroundColor: "#00D4FF",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: { color: "#0B1519", fontSize: 16, fontWeight: "700" },
});
