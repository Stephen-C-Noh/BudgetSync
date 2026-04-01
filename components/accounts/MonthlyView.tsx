import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppActions, useAppState } from "@/context/AppContext";
import * as Crypto from "expo-crypto";
import React, { useMemo, useState } from "react";
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
import { MONTH_NAMES } from "@/lib/dateUtils";
import { Account } from "@/lib/types";
import NavRow from "@/components/shared/NavRow";

const ACCOUNT_TYPE_META: Record<string, { label: string; iconName: string; iconColor: string; bgColor: string }> = {
  bank:        { label: "Cash & Bank",  iconName: "wallet-outline", iconColor: "#5BA4FC", bgColor: "#1A2E44" },
  cash:        { label: "Cash & Bank",  iconName: "wallet-outline", iconColor: "#5BA4FC", bgColor: "#1A2E44" },
  investment:  { label: "Investments",  iconName: "trending-up",    iconColor: "#A37CFF", bgColor: "#2A244D" },
  credit_card: { label: "Credit Cards", iconName: "credit-card",    iconColor: "#FF7C7C", bgColor: "#3D242B" },
};

const ACCOUNT_TYPES: { key: Account["type"]; label: string }[] = [
  { key: "cash",        label: "Cash" },
  { key: "bank",        label: "Bank" },
  { key: "credit_card", label: "Credit Card" },
  { key: "investment",  label: "Investment" },
];

type Props = { accounts: Account[] };

export default function AccountsMonthlyView({ accounts }: Props) {
  const { addAccount } = useAppActions();
  const { userProfile } = useAppState();

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<Account["type"]>("bank");
  const [balanceStr, setBalanceStr] = useState("0.00");
  const [last4, setLast4] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { netWorth, assets, liabilities } = useMemo(() => {
    let assets = 0, liabilities = 0;
    for (const a of accounts) {
      if (a.type === "credit_card") liabilities += Math.abs(a.balance);
      else assets += a.balance;
    }
    return { netWorth: assets - liabilities, assets, liabilities };
  }, [accounts]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof accounts> = {};
    for (const a of accounts) {
      const key = a.type === "cash" ? "bank" : a.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    }
    return groups;
  }, [accounts]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  function openModal() {
    setAccountName("");
    setAccountType("bank");
    setBalanceStr("0.00");
    setLast4("");
    setModalVisible(true);
  }

  async function handleSave() {
    const trimmed = accountName.trim();
    if (!trimmed) {
      Alert.alert("Missing Name", "Please enter an account name.");
      return;
    }
    const balance = parseFloat(balanceStr);
    if (isNaN(balance)) {
      Alert.alert("Invalid Balance", "Please enter a valid balance.");
      return;
    }
    if (last4 && !/^\d{4}$/.test(last4)) {
      Alert.alert("Invalid Last 4", "Last 4 digits must be exactly 4 numbers.");
      return;
    }
    setIsSaving(true);
    await addAccount({
      id: Crypto.randomUUID(),
      name: trimmed,
      type: accountType,
      balance,
      last4: last4.trim() || undefined,
      currency: userProfile?.currency ?? "USD",
      created_at: new Date().toISOString(),
    });
    setIsSaving(false);
    setModalVisible(false);
  }

  return (
    <>
      <NavRow label={`${MONTH_NAMES[month]} ${year}`} onPrev={prevMonth} onNext={nextMonth} />

      <View style={styles.netWorthCard}>
        <Text style={styles.netWorthLabel}>Net Worth</Text>
        <Text style={styles.netWorthValue}>
          ${netWorth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{accounts.length} Account{accounts.length !== 1 ? "s" : ""}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Updated Today</Text>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.box}>
          <View style={styles.boxHeader}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(42, 211, 0, 0.1)" }]}>
              <MaterialCommunityIcons name="bank" size={18} color="#2AD300" />
            </View>
            <Text style={styles.boxTitle}>Assets</Text>
          </View>
          <Text style={styles.boxValue}>
            ${assets.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.greenText}>Total Value</Text>
        </View>

        <View style={styles.box}>
          <View style={styles.boxHeader}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(255, 77, 77, 0.1)" }]}>
              <MaterialCommunityIcons name="credit-card-off" size={18} color="#FF4D4D" />
            </View>
            <Text style={styles.boxTitle}>Liabilities</Text>
          </View>
          <Text style={styles.boxValue}>
            ${liabilities.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.redText}>Total Debt</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>ACCOUNT BREAKDOWN</Text>
      {accounts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No accounts yet.</Text>
        </View>
      ) : (
        Object.entries(grouped).map(([type, accs]) => {
          const meta = ACCOUNT_TYPE_META[type] ?? ACCOUNT_TYPE_META.bank;
          const groupBalance = accs.reduce((s, a) => s + a.balance, 0);
          const isCredit = type === "credit_card";
          return (
            <View key={type} style={styles.accountItem}>
              <View style={styles.accountLeft}>
                <View style={[styles.logoBox, { backgroundColor: meta.bgColor }]}>
                  <MaterialCommunityIcons name={meta.iconName as any} size={24} color={meta.iconColor} />
                </View>
                <View>
                  <Text style={styles.accountName}>{meta.label}</Text>
                  <Text style={styles.accountSub}>{accs.map((a) => a.name).join(", ")}</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.accountValue, isCredit && { color: "#FF4D4D" }]}>
                  {isCredit ? "-" : ""}${Math.abs(groupBalance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={isCredit ? styles.accountTagRed : styles.accountTagGreen}>
                  {isCredit ? "Credit" : "Stable"}
                </Text>
              </View>
            </View>
          );
        })
      )}

      <TouchableOpacity style={styles.addButton} onPress={openModal} activeOpacity={0.85}>
        <Ionicons name="add-circle-outline" size={20} color="#0B1519" style={{ marginRight: 8 }} />
        <Text style={styles.addButtonText}>+ Add Account</Text>
      </TouchableOpacity>

      {/* Add Account Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Account</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#7A869A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Account Name */}
              <Text style={styles.fieldLabel}>ACCOUNT NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Chase Checking"
                placeholderTextColor="#3A4A5A"
                value={accountName}
                onChangeText={setAccountName}
              />

              {/* Account Type */}
              <Text style={styles.fieldLabel}>ACCOUNT TYPE</Text>
              <View style={styles.typeRow}>
                {ACCOUNT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.typePill, accountType === t.key && styles.typePillActive]}
                    onPress={() => setAccountType(t.key)}
                  >
                    <Text style={[styles.typePillText, accountType === t.key && styles.typePillTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Opening Balance */}
              <Text style={styles.fieldLabel}>OPENING BALANCE</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balancePrefix}>$</Text>
                <TextInput
                  style={styles.balanceInput}
                  value={balanceStr}
                  onChangeText={setBalanceStr}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
              </View>

              {/* Last 4 (bank / credit only) */}
              {(accountType === "bank" || accountType === "credit_card") && (
                <>
                  <Text style={styles.fieldLabel}>LAST 4 DIGITS (OPTIONAL)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 4242"
                    placeholderTextColor="#3A4A5A"
                    value={last4}
                    onChangeText={(v) => setLast4(v.replace(/\D/g, "").slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save Account →"}</Text>
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  netWorthCard: { backgroundColor: "#00D9FF", borderRadius: 24, padding: 24, marginBottom: 25 },
  netWorthLabel: { color: "#0B1519", fontSize: 14, fontWeight: "500", opacity: 0.7 },
  netWorthValue: { color: "#0B1519", fontSize: 36, fontWeight: "800", marginVertical: 8 },
  tagsRow: { flexDirection: "row", marginTop: 10 },
  tag: {
    backgroundColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 10,
  },
  tagText: { color: "#0B1519", fontSize: 12, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  box: { flex: 0.48, backgroundColor: "#1C252E", padding: 16, borderRadius: 20 },
  boxHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 10 },
  boxTitle: { color: "#7A869A", fontSize: 14, fontWeight: "500" },
  boxValue: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  greenText: { color: "#2AD300", fontSize: 13 },
  redText: { color: "#FF4D4D", fontSize: 13 },
  sectionTitle: { color: "#fff", marginBottom: 15, fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  accountItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1C252E",
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
  },
  accountLeft: { flexDirection: "row", alignItems: "center" },
  logoBox: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 14 },
  accountName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  accountSub: { color: "#7A869A", fontSize: 13, marginTop: 2 },
  accountValue: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 2 },
  accountTagGreen: { color: "#2AD300", fontSize: 11 },
  accountTagRed: { color: "#FF4D4D", fontSize: 11 },
  emptyState: { backgroundColor: "#1C252E", borderRadius: 16, padding: 24, alignItems: "center" },
  emptyText: { color: "#7A869A", fontSize: 14 },

  addButton: {
    backgroundColor: "#00D4FF",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: { color: "#0B1519", fontSize: 16, fontWeight: "700" },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
    backgroundColor: "#0B1519",
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
  modalTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },

  fieldLabel: {
    color: "#7A869A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: "#1C252E",
    borderRadius: 14,
    padding: 16,
    color: "#FFF",
    fontSize: 15,
    marginBottom: 24,
  },

  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  typePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#1C252E",
    borderWidth: 1,
    borderColor: "#2A333D",
  },
  typePillActive: { backgroundColor: "rgba(0, 212, 255, 0.12)", borderColor: "#00D4FF" },
  typePillText: { color: "#7A869A", fontSize: 13, fontWeight: "500" },
  typePillTextActive: { color: "#00D4FF" },

  balanceRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1C252E", borderRadius: 14, paddingHorizontal: 16, marginBottom: 24 },
  balancePrefix: { color: "#00D4FF", fontSize: 28, fontWeight: "700", marginRight: 4 },
  balanceInput: { flex: 1, color: "#00D4FF", fontSize: 32, fontWeight: "800", paddingVertical: 12 },

  saveButton: {
    backgroundColor: "#00D4FF",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: { color: "#0B1519", fontSize: 16, fontWeight: "700" },
});
