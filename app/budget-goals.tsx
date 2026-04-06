import { Ionicons } from "@expo/vector-icons";
import { useAppActions, useAppState } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/context/ThemeContext";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BudgetGoal } from "@/lib/types";

/** The three supported budget periods. */
const PERIODS: { key: BudgetGoal["period"]; label: string }[] = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

/**
 * Displays monthly budget progress and all category-level goals.
 * The "Add Budget Goal" button opens an inline modal to create a new goal.
 */
export default function BudgetGoalsScreen() {
  const router = useRouter();
  const { budgetGoals, categories, transactions, isLoading } = useAppState();
  const { deleteBudgetGoal, addBudgetGoal } = useAppActions();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // ─── Modal state ──────────────────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [goalPeriod, setGoalPeriod] = useState<BudgetGoal["period"]>("monthly");
  const [goalCategoryId, setGoalCategoryId] = useState("");
  const [goalAmountStr, setGoalAmountStr] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  /**
   * Ref-based lock set synchronously at the top of handleSave.
   * React state updates are async, so isSaving alone cannot prevent two rapid
   * taps from both entering the save path before the first re-render fires.
   */
  const isSavingRef = useRef(false);

  // ─── Derived data ─────────────────────────────────────────────────────────

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const monthlySpentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      const d = new Date(tx.date);
      if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth)
        continue;
      map[tx.category_id] = (map[tx.category_id] ?? 0) + tx.amount;
    }
    return map;
  }, [transactions, currentYear, currentMonth]);

  /**
   * Monthly goals only, used for the summary card at the top of the screen.
   * All goals (any period) are shown in the category list below.
   */
  const monthlyGoals = useMemo(
    () => budgetGoals.filter((g) => g.period === "monthly"),
    [budgetGoals],
  );

  const totalBudget = useMemo(
    () => monthlyGoals.reduce((sum, g) => sum + g.limit_amount, 0),
    [monthlyGoals],
  );

  const totalSpent = useMemo(
    () =>
      monthlyGoals.reduce(
        (sum, g) => sum + (monthlySpentByCategory[g.category_id] ?? 0),
        0,
      ),
    [monthlyGoals, monthlySpentByCategory],
  );

  /**
   * Expense-only categories that do not yet have a goal for the currently
   * selected period. This prevents duplicate (category + period) goals without
   * relying on a silent DB overwrite.
   */
  const availableCategories = useMemo(() => {
    const takenIds = new Set(
      budgetGoals
        .filter((g) => g.period === goalPeriod)
        .map((g) => g.category_id),
    );
    return categories.filter(
      (c) => c.type === "expense" && !takenIds.has(c.id),
    );
  }, [categories, budgetGoals, goalPeriod]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  /** Opens the modal with default state. */
  function openModal() {
    setGoalPeriod("monthly");
    setGoalCategoryId("");
    setGoalAmountStr("");
    setModalVisible(true);
  }

  /**
   * Changes the selected period and clears the category selection, since
   * available categories differ per period.
   *
   * @param period - The newly selected period.
   */
  function handlePeriodChange(period: BudgetGoal["period"]) {
    setGoalPeriod(period);
    setGoalCategoryId("");
  }

  /**
   * Validates the form and saves the new budget goal.
   *
   * Validation rules:
   * - A category must be selected.
   * - Amount must parse as a valid float greater than zero.
   */
  async function handleSave() {
    // Ref-based synchronous guard must come first — isSaving state is async
    // and cannot reliably block two rapid taps from both entering this path.
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    if (!goalCategoryId) {
      Alert.alert("No Category", "Please select a category.");
      isSavingRef.current = false;
      return;
    }
    // Re-validate that the selected category still exists and is an expense
    // category. A background sync could have removed or changed it while the
    // modal was open; SQLite FK enforcement is off so nothing else blocks this.
    const selectedCategory = categories.find((c) => c.id === goalCategoryId);
    if (!selectedCategory || selectedCategory.type !== "expense") {
      Alert.alert(
        "Invalid Category",
        "The selected category is no longer available. Please choose another.",
      );
      setGoalCategoryId("");
      isSavingRef.current = false;
      return;
    }

    // Re-validate at save time: a background sync may have added a goal for
    // this category+period while the modal was open, which insertBudgetGoal
    // would not detect — it has no deduplication logic.
    const isDuplicate = budgetGoals.some(
      (g) => g.category_id === goalCategoryId && g.period === goalPeriod,
    );
    if (isDuplicate) {
      Alert.alert(
        "Goal Already Exists",
        "A goal for this category and period was added while this form was open. Please choose a different category or period.",
      );
      // Clear selection so the user is not stuck — the category is no longer
      // in availableCategories and Save would keep failing otherwise.
      setGoalCategoryId("");
      isSavingRef.current = false;
      return;
    }
    // Normalise comma decimal separators (e.g. "10,50" -> "10.50") before
    // parsing, since parseFloat("10,50") silently truncates to 10.
    const normalised = goalAmountStr.trim().replace(",", ".");
    const amount = parseFloat(normalised);
    // Number.isFinite rejects non-finite values like Infinity/-Infinity;
    // NaN would already be rejected by a typical isNaN(amount) || amount <= 0 guard.
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than zero.");
      isSavingRef.current = false;
      return;
    }

    setIsSaving(true);
    try {
      await addBudgetGoal({
        id: Crypto.randomUUID(),
        category_id: goalCategoryId,
        limit_amount: amount,
        period: goalPeriod,
        created_at: new Date().toISOString(),
      });
      setModalVisible(false);
    } catch {
      Alert.alert("Save Failed", "We couldn't save this goal. Please try again.");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

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

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginLeft: 15, paddingRight: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget Goals</Text>
        <View style={{ width: 24, marginRight: 15 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
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
                      width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%` as any,
                      backgroundColor:
                        totalSpent > totalBudget ? colors.expense : colors.accent,
                    },
                  ]}
                />
              </View>
              <View style={styles.summaryFooter}>
                <Text style={styles.summaryMuted}>
                  Spent: ${totalSpent.toLocaleString()}
                </Text>
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

        {/*
         * Show all goals regardless of period. Monthly goals also drive the
         * summary card above; weekly/yearly goals are visible and deletable here.
         * A period badge on each row makes the period explicit.
         */}
        <View style={styles.card}>
          {budgetGoals.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No budget goals yet.</Text>
            </View>
          ) : (
            budgetGoals.map((goal, index) => {
              const cat = categoryMap.get(goal.category_id);
              // Progress bar is only meaningful for monthly goals (we have monthly spend data)
              const spent = goal.period === "monthly"
                ? (monthlySpentByCategory[goal.category_id] ?? 0)
                : 0;
              // Guard against division by zero for legacy/invalid goals
              const pct = goal.limit_amount > 0
                ? Math.min((spent / goal.limit_amount) * 100, 100)
                : 0;
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
                          <Text style={styles.goalCategory}>
                            {cat?.name ?? "Unknown"}
                          </Text>
                          {/* Period badge so weekly/yearly goals are identifiable */}
                          <View style={styles.periodBadge}>
                            <Text style={styles.periodBadgeText}>
                              {goal.period.toUpperCase()}
                            </Text>
                          </View>
                          {isOver && (
                            <View style={styles.overBadge}>
                              <Text style={styles.overBadgeText}>OVER</Text>
                            </View>
                          )}
                        </View>
                        {goal.period === "monthly" && (
                          <>
                            <View style={styles.goalBarTrack}>
                              <View
                                style={[
                                  styles.goalBarFill,
                                  {
                                    width: `${pct}%` as any,
                                    backgroundColor: isOver
                                      ? colors.expense
                                      : colors.accent,
                                  },
                                ]}
                              />
                            </View>
                            <Text style={styles.goalAmounts}>
                              $
                              {spent.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              / $
                              {goal.limit_amount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                          </>
                        )}
                        {goal.period !== "monthly" && (
                          <Text style={styles.goalAmounts}>
                            Limit: $
                            {goal.limit_amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(goal.id)}>
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.danger}
                      />
                    </TouchableOpacity>
                  </View>
                  {index < budgetGoals.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              );
            })
          )}
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={openModal}
          activeOpacity={0.85}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={colors.onAccent}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.addBtnText}>Add Budget Goal</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Add Budget Goal Bottom Sheet ─── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => { if (!isSaving) setModalVisible(false); }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalSheet}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Budget Goal</Text>
              {/* Disabled while saving to prevent closing mid-flight */}
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={isSaving}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={isSaving ? colors.textDisabled : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Period selector */}
              <Text style={styles.fieldLabel}>PERIOD</Text>
              <View style={styles.pillRow}>
                {PERIODS.map((p) => (
                  <TouchableOpacity
                    key={p.key}
                    style={[
                      styles.pill,
                      goalPeriod === p.key && styles.pillActive,
                    ]}
                    onPress={() => handlePeriodChange(p.key)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        goalPeriod === p.key && styles.pillTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category picker */}
              <Text style={styles.fieldLabel}>CATEGORY</Text>
              {availableCategories.length === 0 ? (
                <View style={styles.noCategoriesBox}>
                  <Text style={styles.noCategoriesText}>
                    All expense categories already have a goal for this period.
                  </Text>
                </View>
              ) : (
                <View style={styles.categoryList}>
                  {availableCategories.map((cat, index) => {
                    const isSelected = goalCategoryId === cat.id;
                    return (
                      <View key={cat.id}>
                        <TouchableOpacity
                          style={[
                            styles.categoryRow,
                            isSelected && styles.categoryRowSelected,
                          ]}
                          onPress={() => setGoalCategoryId(cat.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.categoryEmoji}>
                            {cat.icon ?? "📦"}
                          </Text>
                          <Text
                            style={[
                              styles.categoryName,
                              isSelected && styles.categoryNameSelected,
                            ]}
                          >
                            {cat.name}
                          </Text>
                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color={colors.accent}
                            />
                          )}
                        </TouchableOpacity>
                        {index < availableCategories.length - 1 && (
                          <View style={styles.divider} />
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Amount input */}
              <Text style={styles.fieldLabel}>LIMIT AMOUNT</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountPrefix}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={goalAmountStr}
                  onChangeText={setGoalAmountStr}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textDisabled}
                  selectTextOnFocus
                />
              </View>

              {/* Save button */}
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  (isSaving || availableCategories.length === 0) && {
                    opacity: 0.6,
                  },
                ]}
                onPress={handleSave}
                disabled={isSaving || availableCategories.length === 0}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>
                  {isSaving ? "Saving..." : "Save Goal →"}
                </Text>
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 15,
    },
    headerTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "700" },
    scroll: { paddingHorizontal: 20 },

    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 6,
    },
    summaryTotal: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: "800",
      marginBottom: 14,
    },
    progressTrack: {
      height: 8,
      backgroundColor: colors.background,
      borderRadius: 999,
      overflow: "hidden",
      marginBottom: 10,
    },
    progressFill: { height: "100%", borderRadius: 999 },
    summaryFooter: { flexDirection: "row", justifyContent: "space-between" },
    summaryMuted: { color: colors.textSecondary, fontSize: 12 },

    sectionLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 12,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 16,
    },

    emptyRow: { padding: 20, alignItems: "center" },
    emptyText: { color: colors.textSecondary, fontSize: 14 },

    goalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
    },
    goalLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: 12,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    goalEmoji: { fontSize: 20 },
    goalInfo: { flex: 1 },
    goalTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    goalCategory: { color: colors.textPrimary, fontSize: 15, fontWeight: "600", flexShrink: 1 },
    /** Small pill showing the goal's period (WEEKLY / MONTHLY / YEARLY). */
    periodBadge: {
      backgroundColor: colors.accentSubtle,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 8,
    },
    periodBadgeText: { color: colors.accent, fontSize: 9, fontWeight: "800" },
    overBadge: {
      backgroundColor: colors.overBadgeBg,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 8,
    },
    overBadgeText: { color: colors.expense, fontSize: 9, fontWeight: "800" },
    goalBarTrack: {
      height: 5,
      backgroundColor: colors.background,
      borderRadius: 999,
      overflow: "hidden",
      marginBottom: 5,
    },
    goalBarFill: { height: "100%", borderRadius: 999 },
    goalAmounts: { color: colors.textSecondary, fontSize: 11 },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },

    addBtn: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    addBtnText: { color: colors.onAccent, fontSize: 16, fontWeight: "700" },

    // ─── Modal ────────────────────────────────────────────────────────────────
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: colors.overlay,
    },
    modalSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 20,
      maxHeight: "85%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    modalTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "700" },

    fieldLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 10,
    },

    pillRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
    pill: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 24,
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillActive: {
      backgroundColor: colors.accentLight,
      borderColor: colors.accent,
    },
    pillText: { color: colors.textSecondary, fontSize: 13, fontWeight: "500" },
    pillTextActive: { color: colors.accent, fontWeight: "700" },

    /** Container for the tappable category list inside the modal. */
    categoryList: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 24,
    },
    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
    },
    /** Highlight the selected category row with a subtle accent background. */
    categoryRowSelected: {
      backgroundColor: colors.accentBg,
    },
    categoryEmoji: { fontSize: 18, marginRight: 12 },
    categoryName: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "500",
    },
    categoryNameSelected: { color: colors.accent, fontWeight: "600" },

    /** Shown when all expense categories are already covered for the period. */
    noCategoriesBox: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      alignItems: "center",
    },
    noCategoriesText: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: "center",
    },

    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    amountPrefix: {
      color: colors.accent,
      fontSize: 28,
      fontWeight: "700",
      marginRight: 4,
    },
    amountInput: {
      flex: 1,
      color: colors.accent,
      fontSize: 32,
      fontWeight: "800",
      paddingVertical: 12,
    },

    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 17,
      alignItems: "center",
      marginTop: 8,
    },
    saveBtnText: { color: colors.onAccent, fontSize: 16, fontWeight: "700" },
  });
}
