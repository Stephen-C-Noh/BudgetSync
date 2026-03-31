import { Ionicons } from "@expo/vector-icons";
import { useAppActions, useAppState } from "@/context/AppContext";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddTransactionScreen() {
  const router = useRouter();
  const { categories, accounts } = useAppState();
  const { addTransaction } = useAppActions();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("0.00");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const filteredCategories = categories.filter((c) => c.type === type);
  const primaryAccount = accounts[0] ?? null;

  function handleTypeChange(newType: "expense" | "income") {
    setType(newType);
    setSelectedCategoryId(null);
  }

  async function handleSave() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      Alert.alert("Invalid Amount", "Please enter an amount greater than 0.");
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert("No Category", "Please select a category.");
      return;
    }
    if (!primaryAccount) {
      Alert.alert("No Account", "No account found. Please add an account first.");
      return;
    }

    setIsSaving(true);
    const now = new Date().toISOString();
    await addTransaction({
      id: Crypto.randomUUID(),
      account_id: primaryAccount.id,
      category_id: selectedCategoryId,
      type,
      amount: parsed,
      note: note.trim() || undefined,
      date: today,
      created_at: now,
      synced: 0,
    });
    setIsSaving(false);
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#00D4FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Transaction</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Expense / Income toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, type === "expense" && styles.toggleActive]}
            onPress={() => handleTypeChange("expense")}
          >
            <Text style={[styles.toggleText, type === "expense" && styles.toggleTextActive]}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, type === "income" && styles.toggleActive]}
            onPress={() => handleTypeChange("income")}
          >
            <Text style={[styles.toggleText, type === "income" && styles.toggleTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={styles.amountRow}>
          <Text style={styles.amountPrefix}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
        </View>

        {/* Category picker */}
        <Text style={styles.fieldLabel}>CATEGORY</Text>
        <View style={styles.categoryWrap}>
          {filteredCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                selectedCategoryId === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[
                styles.categoryText,
                selectedCategoryId === cat.id && styles.categoryTextActive,
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date */}
        <Text style={styles.fieldLabel}>DATE</Text>
        <View style={styles.fieldRow}>
          <Ionicons name="calendar-outline" size={18} color="#7A869A" style={{ marginRight: 10 }} />
          <Text style={styles.fieldValue}>{today}</Text>
        </View>

        {/* Account */}
        <Text style={styles.fieldLabel}>
          {type === "expense" ? "PAYMENT METHOD" : "ACCOUNT"}
        </Text>
        <View style={styles.fieldRow}>
          <Ionicons name="wallet-outline" size={18} color="#7A869A" style={{ marginRight: 10 }} />
          <Text style={styles.fieldValue}>
            {primaryAccount
              ? `${primaryAccount.name}${primaryAccount.last4 ? `  •••• ${primaryAccount.last4}` : ""}`
              : "No account"}
          </Text>
        </View>

        {/* Note */}
        <Text style={styles.fieldLabel}>NOTE (OPTIONAL)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Add a note..."
          placeholderTextColor="#7A869A"
          value={note}
          onChangeText={setNote}
          multiline
        />

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>
            {isSaving ? "Saving..." : "Save Transaction →"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>BACK</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1519" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  toggle: {
    flexDirection: "row",
    backgroundColor: "#1C252E",
    borderRadius: 14,
    padding: 4,
    marginBottom: 32,
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
    marginBottom: 36,
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

  categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
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
    minHeight: 80,
    marginBottom: 32,
    textAlignVertical: "top",
  },

  saveBtn: {
    backgroundColor: "#00D4FF",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 16,
  },
  saveBtnText: { color: "#0B1519", fontSize: 16, fontWeight: "700" },

  backLink: { alignItems: "center", marginBottom: 8 },
  backLinkText: { color: "#7A869A", fontSize: 13, fontWeight: "600", letterSpacing: 1 },
});
