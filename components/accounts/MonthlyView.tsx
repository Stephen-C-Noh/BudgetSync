import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppActions, useAppState } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/context/ThemeContext";
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

/** Maps each account type to its display label, icon, and theme colors. */
const ACCOUNT_TYPE_META = (
  colors: Colors,
): Record<
  string,
  { label: string; iconName: string; iconColor: string; bgColor: string }
> => ({
  bank: {
    label: "Cash & Bank",
    iconName: "wallet-outline",
    iconColor: colors.iconBank,
    bgColor: colors.bgBank,
  },
  cash: {
    label: "Cash & Bank",
    iconName: "wallet-outline",
    iconColor: colors.iconBank,
    bgColor: colors.bgBank,
  },
  investment: {
    label: "Investments",
    iconName: "trending-up",
    iconColor: colors.iconInvestment,
    bgColor: colors.bgInvestment,
  },
  credit_card: {
    label: "Credit Cards",
    iconName: "credit-card",
    iconColor: colors.iconCredit,
    bgColor: colors.bgCredit,
  },
});

/** Selectable account type options for the add/edit sheet. */
const ACCOUNT_TYPES: { key: Account["type"]; label: string }[] = [
  { key: "cash", label: "Cash" },
  { key: "bank", label: "Bank" },
  { key: "credit_card", label: "Credit Card" },
  { key: "investment", label: "Investment" },
];

type Props = { accounts: Account[] };

/**
 * Displays a monthly net-worth summary, an asset/liability breakdown,
 * and a list of individual account cards. Each card is tappable to open
 * an edit sheet; a separate button opens the "Add Account" sheet.
 */
export default function AccountsMonthlyView({ accounts }: Props) {
  const { addAccount, updateAccount, deleteAccount } = useAppActions();
  const { userProfile } = useAppState();
  const { colors } = useTheme();

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const accountTypeMeta = useMemo(() => ACCOUNT_TYPE_META(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  // ─── Sheet visibility ──────────────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);

  /**
   * The account currently being edited, or `null` when the sheet is in "Add" mode.
   * Determines whether Save calls `addAccount` or `updateAccount`.
   */
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // ─── Form state ───────────────────────────────────────────────────────────
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<Account["type"]>("bank");
  const [balanceStr, setBalanceStr] = useState("0.00");
  const [last4, setLast4] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ─── Net-worth totals ─────────────────────────────────────────────────────
  const { netWorth, assets, liabilities } = useMemo(() => {
    let assets = 0,
      liabilities = 0;
    for (const a of accounts) {
      if (a.type === "credit_card") liabilities += Math.abs(a.balance);
      else assets += a.balance;
    }
    return { netWorth: assets - liabilities, assets, liabilities };
  }, [accounts]);

  // ─── Month navigation ─────────────────────────────────────────────────────
  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  }

  // ─── Sheet helpers ────────────────────────────────────────────────────────

  /** Opens the sheet in "Add" mode with all fields reset to defaults. */
  function openAddSheet() {
    setEditingAccount(null);
    setAccountName("");
    setAccountType("bank");
    setBalanceStr("0.00");
    setLast4("");
    setModalVisible(true);
  }

  /**
   * Opens the sheet in "Edit" mode, pre-filling every field with the
   * selected account's current values.
   *
   * @param account - The account to edit.
   */
  function openEditSheet(account: Account) {
    setEditingAccount(account);
    setAccountName(account.name);
    setAccountType(account.type);
    setBalanceStr(account.balance.toFixed(2));
    setLast4(account.last4 ?? "");
    setModalVisible(true);
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  /**
   * Validates the form fields and either adds a new account or updates the
   * existing one depending on whether `editingAccount` is set.
   *
   * Validation rules:
   * - Account name must not be blank.
   * - Balance must parse as a valid float.
   * - `last4`, if provided, must match `/^\d{4}$/`.
   */
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

    if (editingAccount) {
      // Edit mode — preserve immutable fields (id, currency, created_at)
      await updateAccount({
        ...editingAccount,
        name: trimmed,
        type: accountType,
        balance,
        last4: last4.trim() || undefined,
      });
    } else {
      // Add mode
      await addAccount({
        id: Crypto.randomUUID(),
        name: trimmed,
        type: accountType,
        balance,
        last4: last4.trim() || undefined,
        currency: userProfile?.currency ?? "USD",
        created_at: new Date().toISOString(),
      });
    }

    setIsSaving(false);
    setModalVisible(false);
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  /**
   * Shows a confirmation Alert before deleting the currently edited account.
   * Transactions linked to this account are left intact (orphan-safe).
   */
  function handleDelete() {
    if (!editingAccount) return;
    Alert.alert(
      "Delete Account",
      "Deleting this account will not delete its transactions. They will remain unlinked.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteAccount(editingAccount.id);
            setModalVisible(false);
          },
        },
      ],
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <NavRow
        label={`${MONTH_NAMES[month]} ${year}`}
        onPrev={prevMonth}
        onNext={nextMonth}
      />

      {/* Net Worth Summary Card */}
      <View style={styles.netWorthCard}>
        <Text style={styles.netWorthLabel}>Net Worth</Text>
        <Text style={styles.netWorthValue}>
          $
          {netWorth.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {accounts.length} Account{accounts.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Updated Today</Text>
          </View>
        </View>
      </View>

      {/* Assets / Liabilities Boxes */}
      <View style={styles.row}>
        <View style={styles.box}>
          <View style={styles.boxHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.assetSubtle },
              ]}
            >
              <MaterialCommunityIcons
                name="bank"
                size={18}
                color={colors.chartAssets}
              />
            </View>
            <Text style={styles.boxTitle}>Assets</Text>
          </View>
          <Text style={styles.boxValue}>
            $
            {assets.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={styles.greenText}>Total Value</Text>
        </View>

        <View style={styles.box}>
          <View style={styles.boxHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.liabilitySubtle },
              ]}
            >
              <MaterialCommunityIcons
                name="credit-card-off"
                size={18}
                color={colors.danger}
              />
            </View>
            <Text style={styles.boxTitle}>Liabilities</Text>
          </View>
          <Text style={styles.boxValue}>
            $
            {liabilities.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={styles.redText}>Total Debt</Text>
        </View>
      </View>

      {/* Account Breakdown — individual tappable cards */}
      <Text style={styles.sectionTitle}>ACCOUNT BREAKDOWN</Text>
      {accounts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No accounts yet.</Text>
        </View>
      ) : (
        accounts.map((account) => {
          /*
           * `cash` and `bank` share the same visual meta (wallet icon, blue tint).
           * Normalise to "bank" so we always get a valid meta entry.
           */
          const typeKey = account.type === "cash" ? "bank" : account.type;
          const meta = accountTypeMeta[typeKey] ?? accountTypeMeta.bank;
          const isCredit = account.type === "credit_card";

          return (
            <TouchableOpacity
              key={account.id}
              style={styles.accountItem}
              onPress={() => openEditSheet(account)}
              activeOpacity={0.75}
            >
              <View style={styles.accountLeft}>
                <View
                  style={[styles.logoBox, { backgroundColor: meta.bgColor }]}
                >
                  <MaterialCommunityIcons
                    name={meta.iconName as any}
                    size={24}
                    color={meta.iconColor}
                  />
                </View>
                <View>
                  <Text style={styles.accountName}>{account.name}</Text>
                  {/* Show masked card number if last4 is set, otherwise show type label */}
                  <Text style={styles.accountSub}>
                    {account.last4 ? `•••• ${account.last4}` : meta.label}
                  </Text>
                </View>
              </View>
              <View style={styles.accountRight}>
                <Text
                  style={[
                    styles.accountValue,
                    isCredit && { color: colors.danger },
                  ]}
                >
                  {isCredit ? "-" : ""}$
                  {Math.abs(account.balance).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                <Text
                  style={isCredit ? styles.accountTagRed : styles.accountTagGreen}
                >
                  {isCredit ? "Credit" : "Stable"}
                </Text>
              </View>
              {/* Chevron hints that the card is tappable */}
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textDisabled}
                style={styles.chevron}
              />
            </TouchableOpacity>
          );
        })
      )}

      {/* Add Account Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={openAddSheet}
        activeOpacity={0.85}
      >
        <Ionicons
          name="add-circle-outline"
          size={20}
          color={colors.onAccent}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.addButtonText}>+ Add Account</Text>
      </TouchableOpacity>

      {/* ─── Add / Edit Account Bottom Sheet ─── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              {/* Title reflects current mode */}
              <Text style={styles.modalTitle}>
                {editingAccount ? "Edit Account" : "Add Account"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Account Name */}
              <Text style={styles.fieldLabel}>ACCOUNT NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Chase Checking"
                placeholderTextColor={colors.textDisabled}
                value={accountName}
                onChangeText={setAccountName}
              />

              {/* Account Type */}
              <Text style={styles.fieldLabel}>ACCOUNT TYPE</Text>
              <View style={styles.typeRow}>
                {ACCOUNT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      styles.typePill,
                      accountType === t.key && styles.typePillActive,
                    ]}
                    onPress={() => setAccountType(t.key)}
                  >
                    <Text
                      style={[
                        styles.typePillText,
                        accountType === t.key && styles.typePillTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Balance — "OPENING BALANCE" for new accounts, "BALANCE" for edits */}
              <Text style={styles.fieldLabel}>
                {editingAccount ? "BALANCE" : "OPENING BALANCE"}
              </Text>
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

              {/* Last 4 digits — only relevant for bank and credit card accounts */}
              {(accountType === "bank" || accountType === "credit_card") && (
                <>
                  <Text style={styles.fieldLabel}>
                    LAST 4 DIGITS (OPTIONAL)
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 4242"
                    placeholderTextColor={colors.textDisabled}
                    value={last4}
                    onChangeText={(v) =>
                      setLast4(v.replace(/\D/g, "").slice(0, 4))
                    }
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </>
              )}

              {/* Primary action */}
              <TouchableOpacity
                style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving
                    ? "Saving..."
                    : editingAccount
                      ? "Update Account →"
                      : "Save Account →"}
                </Text>
              </TouchableOpacity>

              {/* Delete — only visible in edit mode */}
              {editingAccount && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.danger}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.deleteButtonText}>Delete Account</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    netWorthCard: {
      backgroundColor: colors.accent,
      borderRadius: 24,
      padding: 24,
      marginBottom: 25,
    },
    netWorthLabel: {
      color: colors.onAccent,
      fontSize: 14,
      fontWeight: "500",
      opacity: 0.7,
    },
    netWorthValue: {
      color: colors.onAccent,
      fontSize: 36,
      fontWeight: "800",
      marginVertical: 8,
    },
    tagsRow: { flexDirection: "row", marginTop: 10 },
    tag: {
      backgroundColor: colors.tagBg,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginRight: 10,
    },
    tagText: { color: colors.onAccent, fontSize: 12, fontWeight: "600" },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
    },
    box: {
      flex: 0.48,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 20,
    },
    boxHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },
    boxTitle: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "500",
    },
    boxValue: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 4,
    },
    greenText: { color: colors.chartAssets, fontSize: 13 },
    redText: { color: colors.danger, fontSize: 13 },
    sectionTitle: {
      color: colors.textPrimary,
      marginBottom: 15,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 1,
    },

    accountItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      padding: 18,
      borderRadius: 20,
      marginBottom: 12,
    },
    accountLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    logoBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    accountName: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    accountSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
    accountRight: { alignItems: "flex-end", marginRight: 8 },
    accountValue: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 2,
    },
    accountTagGreen: { color: colors.chartAssets, fontSize: 11 },
    accountTagRed: { color: colors.danger, fontSize: 11 },
    /** Subtle right-arrow to signal the card is tappable. */
    chevron: { marginLeft: 4 },

    emptyState: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
    },
    emptyText: { color: colors.textSecondary, fontSize: 14 },

    addButton: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
    },
    addButtonText: { color: colors.onAccent, fontSize: 16, fontWeight: "700" },

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
    modalTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "700",
    },

    fieldLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 10,
    },
    textInput: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      color: colors.textPrimary,
      fontSize: 15,
      marginBottom: 24,
    },

    typeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 24,
    },
    typePill: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typePillActive: {
      backgroundColor: colors.accentLight,
      borderColor: colors.accent,
    },
    typePillText: { color: colors.textSecondary, fontSize: 13, fontWeight: "500" },
    typePillTextActive: { color: colors.accent },

    balanceRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    balancePrefix: {
      color: colors.accent,
      fontSize: 28,
      fontWeight: "700",
      marginRight: 4,
    },
    balanceInput: {
      flex: 1,
      color: colors.accent,
      fontSize: 32,
      fontWeight: "800",
      paddingVertical: 12,
    },

    saveButton: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 17,
      alignItems: "center",
      marginTop: 8,
    },
    saveButtonText: { color: colors.onAccent, fontSize: 16, fontWeight: "700" },

    /** Danger-styled button shown only in edit mode for deleting an account. */
    deleteButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      backgroundColor: colors.dangerSubtle,
      borderRadius: 16,
      paddingVertical: 15,
      marginTop: 12,
    },
    deleteButtonText: {
      color: colors.danger,
      fontSize: 15,
      fontWeight: "600",
    },
  });
}
