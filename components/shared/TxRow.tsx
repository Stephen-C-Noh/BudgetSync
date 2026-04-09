import { useAppActions, useAppState } from "@/context/AppContext";
import { Colors, useTheme } from "@/context/ThemeContext";
import { Category, Transaction } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  tx: Transaction;
  category?: Category;
  dateLabel?: string;
};

export default function TxRow({ tx, category, dateLabel }: Props) {
  const { categories, accounts, userProfile } = useAppState();
  const { updateTransaction, deleteTransaction } = useAppActions();
  const { colors } = useTheme();

  const currency = userProfile?.currency || "CAD";

  const [editVisible, setEditVisible] = useState(false);
  const [editType, setEditType] = useState<"expense" | "income">(tx.type);
  const [editAmount, setEditAmount] = useState(tx.amount.toFixed(2));
  const [editCategoryId, setEditCategoryId] = useState(tx.category_id);
  const [editAccountId, setEditAccountId] = useState(tx.account_id);
  const [editNote, setEditNote] = useState(tx.note ?? "");
  const [editDate] = useState(tx.date);
  const [isSaving, setIsSaving] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const meta = dateLabel ? `${dateLabel} · ${category?.name ?? "—"}` : (category?.name ?? "—");
  const filteredCategories = categories.filter((c) => c.type === editType);

  function openEdit() {
    setEditType(tx.type);
    setEditAmount(tx.amount.toFixed(2));
    setEditCategoryId(tx.category_id);
    setEditAccountId(tx.account_id);
    setEditNote(tx.note ?? "");
    setEditVisible(true);
  }

  function handleTypeChange(newType: "expense" | "income") {
    setEditType(newType);
    setEditCategoryId("");
  }

  function handleLongPress() {
    Alert.alert(
      "Delete Transaction",
      `Delete ${tx.type === "expense" ? "-" : "+"}${currency} ${tx.amount.toFixed(2)} · ${category?.name ?? "—"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTransaction(tx.id),
        },
      ]
    );
  }

  async function handleSave() {
    const parsed = parseFloat(editAmount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Invalid Amount", "Please enter an amount greater than 0.");
      return;
    }
    if (!editCategoryId) {
      Alert.alert("No Category", "Please select a category.");
      return;
    }
    if (!editAccountId) {
      Alert.alert("No Account", "Please select an account.");
      return;
    }

    setIsSaving(true);
    await updateTransaction({
      ...tx,
      type: editType,
      amount: parsed,
      category_id: editCategoryId,
      account_id: editAccountId,
      note: editNote.trim() || undefined,
      date: editDate,
      synced: 0,
    });
    setIsSaving(false);
    setEditVisible(false);
  }

  return (
    <>
      <TouchableOpacity
        style={styles.txRow}
        onPress={openEdit}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.txLeft}>
          <View style={styles.txIconBox}>
            <Text style={styles.txEmoji}>{category?.icon ?? "💳"}</Text>
          </View>
          <View>
            <Text style={styles.txName}>{tx.note || category?.name || "Transaction"}</Text>
            <Text style={styles.txMeta}>{meta}</Text>
          </View>
        </View>
        <Text style={[styles.txAmount, tx.type === "expense" ? styles.expenseColor : styles.incomeColor]}>
          {tx.type === "expense" ? "-" : "+"}{currency} {tx.amount.toFixed(2)}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setEditVisible(false)}
            accessibilityLabel="Close modal"
            accessibilityRole="button"
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalSheet}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Transaction</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.toggle}>
                <TouchableOpacity
                  style={[styles.toggleBtn, editType === "expense" && styles.toggleActive]}
                  onPress={() => handleTypeChange("expense")}
                >
                  <Text style={[styles.toggleText, editType === "expense" && styles.toggleTextActive]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, editType === "income" && styles.toggleActive]}
                  onPress={() => handleTypeChange("income")}
                >
                  <Text style={[styles.toggleText, editType === "income" && styles.toggleTextActive]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.amountPrefix}>{currency}</Text>
                <TextInput
                  style={styles.amountInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
              </View>

              <Text style={styles.fieldLabel}>CATEGORY</Text>
              <View style={styles.categoryWrap}>
                {filteredCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryPill, editCategoryId === cat.id && styles.categoryPillActive]}
                    onPress={() => setEditCategoryId(cat.id)}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text style={[styles.categoryText, editCategoryId === cat.id && styles.categoryTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>ACCOUNT</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, marginBottom: 24, paddingBottom: 4 }}
              >
                {accounts.map((acc) => {
                  const isSelected = editAccountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => setEditAccountId(acc.id)}
                      style={[
                        styles.categoryPill,
                        isSelected && styles.categoryPillActive
                      ]}
                    >
                      <Ionicons
                        name="wallet-outline"
                        size={16}
                        color={isSelected ? colors.accent : colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>DATE</Text>
              <View style={styles.fieldRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={styles.calendarIcon} />
                <Text style={styles.fieldValue}>{editDate}</Text>
              </View>

              <Text style={styles.fieldLabel}>NOTE (OPTIONAL)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Add a note..."
                placeholderTextColor={colors.textSecondary}
                value={editNote}
                onChangeText={setEditNote}
                multiline
              />

              <TouchableOpacity
                style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>{isSaving ? "Saving..." : "Save Changes →"}</Text>
              </TouchableOpacity>

              <View style={styles.bottomSpacer} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    txRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
    },
    txLeft: { flexDirection: "row", alignItems: "center" },
    txIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    txEmoji: { fontSize: 20 },
    txName: { color: colors.textPrimary, fontSize: 15, fontWeight: "600" },
    txMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    txAmount: { fontSize: 15, fontWeight: "700" },
    incomeColor: { color: colors.income },
    expenseColor: { color: colors.expense },

    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlayDim,
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "ios" ? 34 : 20,
      maxHeight: "85%",
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 8,
    },
    sheetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      marginBottom: 4,
    },
    sheetTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },

    toggle: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 4,
      marginBottom: 24,
      alignSelf: "center",
      width: "70%",
    },
    toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
    toggleActive: { backgroundColor: colors.accent },
    toggleText: { color: colors.textSecondary, fontWeight: "600", fontSize: 15 },
    toggleTextActive: { color: colors.onAccent, fontWeight: "700" },

    amountRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 28,
    },
    amountPrefix: { color: colors.accent, fontSize: 36, fontWeight: "700", marginRight: 4 },
    amountInput: {
      color: colors.accent,
      fontSize: 48,
      fontWeight: "800",
      minWidth: 120,
      textAlign: "center",
    },

    fieldLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 10,
    },
    categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
    categoryPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryPillActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentBg,
    },
    categoryIcon: { fontSize: 16, marginRight: 6 },
    categoryText: { color: colors.textSecondary, fontSize: 13, fontWeight: "500" },
    categoryTextActive: { color: colors.accent },

    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 24,
    },
    fieldValue: { color: colors.textPrimary, fontSize: 15 },

    noteInput: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      color: colors.textPrimary,
      fontSize: 14,
      minHeight: 72,
      marginBottom: 24,
      textAlignVertical: "top",
    },

    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 17,
      alignItems: "center",
      marginBottom: 8,
    },
    saveBtnText: { color: colors.onAccent, fontSize: 16, fontWeight: "700" },

    calendarIcon: { marginRight: 10 },
    bottomSpacer: { height: 20 },
  });
}