import { Ionicons } from "@expo/vector-icons";
import { useAppActions, useAppState } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/context/ThemeContext";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
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

/** Formats a Date object to a YYYY-MM-DD string. */
function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Returns the earliest selectable date: January 1, 2000. */
function getMinDate(): Date {
  return new Date(2000, 0, 1);
}

/** Returns the latest selectable date: today + 1 year. */
function getMaxDate(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

export default function AddTransactionScreen() {
  const router = useRouter();
  const { categories, accounts } = useAppState();
  const { addTransaction } = useAppActions();
  const { colors } = useTheme();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("0.00");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();

  // Build the initial date string from route param or today
  const _d = new Date();
  const todayStr = formatDate(_d);

  /**
   * The currently selected date as a YYYY-MM-DD string.
   * Initialized from the `date` route param when navigating from a calendar view,
   * otherwise defaults to today.
   */
  const [selectedDate, setSelectedDate] = useState<string>(dateParam ?? todayStr);

  /** Whether the date picker UI is currently visible. */
  const [showPicker, setShowPicker] = useState(false);

  /** The Date object derived from selectedDate, used by the native DateTimePicker. */
  const pickerDate = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const filteredCategories = categories.filter((c) => c.type === type);
  const primaryAccount = accounts[0] ?? null;

  function handleTypeChange(newType: "expense" | "income") {
    setType(newType);
    setSelectedCategoryId(null);
  }

  /**
   * Handles a date selection from the native DateTimePicker.
   * On Android the picker dismisses automatically; on iOS the user
   * must tap "Done" to confirm (handled by `handleIOSConfirm`).
   */
  function handleDateChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (date) setSelectedDate(formatDate(date));
    } else {
      // iOS: update the picker preview live but keep modal open
      if (date) setSelectedDate(formatDate(date));
    }
  }

  /** Confirms the selected date on iOS and closes the modal. */
  function handleIOSConfirm() {
    setShowPicker(false);
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
      date: selectedDate,
      created_at: now,
      synced: 0,
    });
    setIsSaving(false);
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.accent} />
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

        {/* Date — tapping opens the native date picker */}
        <Text style={styles.fieldLabel}>DATE</Text>
        <TouchableOpacity style={styles.fieldRow} onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar-outline" size={18} color={colors.accent} style={{ marginRight: 10 }} />
          <Text style={styles.fieldValue}>{selectedDate}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={styles.fieldChevron} />
        </TouchableOpacity>

        {/* Android: render the picker directly (it shows as a native dialog) */}
        {Platform.OS === "android" && showPicker && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="default"
            minimumDate={getMinDate()}
            maximumDate={getMaxDate()}
            onChange={handleDateChange}
          />
        )}

        {/* iOS: render the picker inside a modal with a Done button */}
        {Platform.OS === "ios" && (
          <Modal
            visible={showPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Date</Text>
                  <TouchableOpacity onPress={handleIOSConfirm} style={styles.modalDoneBtn}>
                    <Text style={styles.modalDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="spinner"
                  minimumDate={getMinDate()}
                  maximumDate={getMaxDate()}
                  onChange={handleDateChange}
                  style={styles.iosPicker}
                  textColor={colors.textPrimary}
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Account */}
        <Text style={styles.fieldLabel}>
          {type === "expense" ? "PAYMENT METHOD" : "ACCOUNT"}
        </Text>
        <View style={styles.fieldRow}>
          <Ionicons name="wallet-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
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
          placeholderTextColor={colors.textSecondary}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    backBtn: { padding: 4 },
    headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },

    scroll: { paddingHorizontal: 20, paddingTop: 8 },

    toggle: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 4,
      marginBottom: 32,
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
      marginBottom: 36,
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

    categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
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
    fieldValue: { color: colors.textPrimary, fontSize: 15, flex: 1 },
    /** Pushes the chevron to the far right of the date row. */
    fieldChevron: { marginLeft: "auto" },

    noteInput: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      color: colors.textPrimary,
      fontSize: 14,
      minHeight: 80,
      marginBottom: 32,
      textAlignVertical: "top",
    },

    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 17,
      alignItems: "center",
      marginBottom: 16,
    },
    saveBtnText: { color: colors.onAccent, fontSize: 16, fontWeight: "700" },

    backLink: { alignItems: "center", marginBottom: 8 },
    backLinkText: { color: colors.textSecondary, fontSize: 13, fontWeight: "600", letterSpacing: 1 },

    // ── iOS date picker modal ──────────────────────────────────────────────
    /** Semi-transparent backdrop that fills the screen. */
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: colors.overlay,
    },
    /** Bottom sheet container for the iOS picker. */
    modalSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 32,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
    modalDoneBtn: { paddingVertical: 4, paddingHorizontal: 8 },
    modalDoneText: { color: colors.accent, fontSize: 16, fontWeight: "700" },
    iosPicker: { width: "100%" },
  });
}
