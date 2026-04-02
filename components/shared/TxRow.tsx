import { Ionicons } from "@expo/vector-icons";
import { useAppActions, useAppState } from "@/context/AppContext";
import React, { useState } from "react";
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
import { Category, Transaction } from "@/lib/types";

type Props = {
  tx: Transaction;
  category?: Category;
  dateLabel?: string;
};

export default function TxRow({ tx, category, dateLabel }: Props) {
  const { categories } = useAppState();
  const { updateTransaction, deleteTransaction } = useAppActions();

  const [editVisible, setEditVisible] = useState(false);
  const [editType, setEditType] = useState<"expense" | "income">(tx.type);
  const [editAmount, setEditAmount] = useState(tx.amount.toFixed(2));
  const [editCategoryId, setEditCategoryId] = useState(tx.category_id);
  const [editNote, setEditNote] = useState(tx.note ?? "");
  const [editDate] = useState(tx.date);
  const [isSaving, setIsSaving] = useState(false);

  const meta = dateLabel ? `${dateLabel} · ${category?.name ?? "—"}` : (category?.name ?? "—");
  const filteredCategories = categories.filter((c) => c.type === editType);

  function openEdit() {
    setEditType(tx.type);
    setEditAmount(tx.amount.toFixed(2));
    setEditCategoryId(tx.category_id);
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
      `Delete ${tx.type === "expense" ? "-" : "+"}$${tx.amount.toFixed(2)} · ${category?.name ?? "—"}?`,
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
    setIsSaving(true);
    await updateTransaction({
      ...tx,
      type: editType,
      amount: parsed,
      category_id: editCategoryId,
      note: editNote.trim() || undefined,
      date: editDate,
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
          {tx.type === "expense" ? "-" : "+"}${tx.amount.toFixed(2)}
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
                <Ionicons name="close" size={22} color="#7A869A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type toggle */}
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

              {/* Amount */}
              <View style={styles.amountRow}>
                <Text style={styles.amountPrefix}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
              </View>

              {/* Category */}
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

              {/* Date */}
              <Text style={styles.fieldLabel}>DATE</Text>
              <View style={styles.fieldRow}>
                <Ionicons name="calendar-outline" size={18} color="#7A869A" style={styles.calendarIcon} />
                <Text style={styles.fieldValue}>{editDate}</Text>
              </View>

              {/* Note */}
              <Text style={styles.fieldLabel}>NOTE (OPTIONAL)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Add a note..."
                placeholderTextColor="#7A869A"
                value={editNote}
                onChangeText={setEditNote}
                multiline
              />

              {/* Save */}
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

const styles = StyleSheet.create({
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

  // Modal / bottom sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#0B1519",
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
    backgroundColor: "#2A333D",
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
  sheetTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  toggle: {
    flexDirection: "row",
    backgroundColor: "#1C252E",
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    alignSelf: "center",
    width: "70%",
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  toggleActive: { backgroundColor: "#00D4FF" },
  toggleText: { color: "#7A869A", fontWeight: "600", fontSize: 15 },
  toggleTextActive: { color: "#0B1519", fontWeight: "700" },

  amountRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  amountPrefix: { color: "#00D4FF", fontSize: 36, fontWeight: "700", marginRight: 4 },
  amountInput: {
    color: "#00D4FF",
    fontSize: 48,
    fontWeight: "800",
    minWidth: 120,
    textAlign: "center",
  },

  fieldLabel: {
    color: "#7A869A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 10,
  },
  categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C252E",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2A333D",
  },
  categoryPillActive: {
    borderColor: "#00D4FF",
    backgroundColor: "rgba(0, 212, 255, 0.1)",
  },
  categoryIcon: { fontSize: 16, marginRight: 6 },
  categoryText: { color: "#7A869A", fontSize: 13, fontWeight: "500" },
  categoryTextActive: { color: "#00D4FF" },

  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C252E",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  fieldValue: { color: "#fff", fontSize: 15 },

  noteInput: {
    backgroundColor: "#1C252E",
    borderRadius: 14,
    padding: 16,
    color: "#fff",
    fontSize: 14,
    minHeight: 72,
    marginBottom: 24,
    textAlignVertical: "top",
  },

  saveBtn: {
    backgroundColor: "#00D4FF",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 8,
  },
  saveBtnText: { color: "#0B1519", fontSize: 16, fontWeight: "700" },

  calendarIcon: { marginRight: 10 },
  bottomSpacer: { height: 20 },
});
