import { useAppActions, useAppState } from "@/context/AppContext";
import { Colors, useTheme } from "@/context/ThemeContext";
import { Account } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCOUNT_TYPES: { value: Account["type"]; label: string; icon: string }[] =
  [
    { value: "bank", label: "Bank", icon: "🏦" },
    { value: "cash", label: "Cash", icon: "💵" },
    { value: "credit_card", label: "Credit Card", icon: "💳" },
    { value: "investment", label: "Investment", icon: "📈" },
  ];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "KRW", "CAD", "AUD"];

function formatAmountFromDigits(digits: string): string {
  const normalized = digits.replace(/\D/g, "");
  const safeDigits = normalized === "" ? "0" : normalized;
  const cents = parseInt(safeDigits, 10) || 0;
  return (cents / 100).toFixed(2);
}

function extractDigits(text: string): string {
  const onlyDigits = text.replace(/\D/g, "");
  const trimmedLeadingZeros = onlyDigits.replace(/^0+(?=\d)/, "");
  return trimmedLeadingZeros === "" ? "0" : trimmedLeadingZeros;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { userProfile, accounts } = useAppState();
  const { updateUserProfile, addAccount, updateSetting } = useAppActions();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [step, setStep] = useState(1);

  // Step 2 state
  const [name, setName] = useState("");

  // Step 3 state
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<Account["type"]>("bank");
  const [last4, setLast4] = useState("");
  const [balanceDigits, setBalanceDigits] = useState("0");
  const [currency, setCurrency] = useState(userProfile?.currency ?? "CAD");

  const balance = useMemo(
    () => formatAmountFromDigits(balanceDigits),
    [balanceDigits]
  );

  function handleBalanceChange(text: string) {
    setBalanceDigits(extractDigits(text));
  }

  async function finishOnboarding() {
    if (accounts.length === 0) {
      await addAccount({
        id: Crypto.randomUUID(),
        name: "Cash",
        type: "cash",
        balance: 0,
        currency: "CAD",
        created_at: new Date().toISOString(),
      });
    }
    await updateSetting("onboarding_complete", "1");
    router.replace("/(tabs)");
  }

  async function handleStep2Next() {
    if (name.trim() && userProfile) {
      await updateUserProfile({ ...userProfile, name: name.trim() });
    }
    setStep(3);
  }

  async function handleStep3Next() {
    if (accountName.trim()) {
      await addAccount({
        id: Crypto.randomUUID(),
        name: accountName.trim(),
        type: accountType,
        last4: last4.trim() || undefined,
        balance: parseFloat(balance) || 0,
        currency,
        created_at: new Date().toISOString(),
      });
    } else {
      await addAccount({
        id: Crypto.randomUUID(),
        name: "Cash",
        type: "cash",
        balance: 0,
        currency: "CAD",
        created_at: new Date().toISOString(),
      });
    }
    await updateSetting("onboarding_complete", "1");
    router.replace("/(tabs)");
  }

  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.logoCircle}>
            <Ionicons name="wallet-outline" size={52} color={colors.accent} />
          </View>
          <Text style={styles.appName}>BudgetSync</Text>
          <Text style={styles.tagline}>Track smarter. Spend better.</Text>
          <Text style={styles.subtitle}>Your personal finance companion</Text>
          <Text style={styles.subtitle}>
            simple, private, and fully offline.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setStep(2)}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 2) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <View style={styles.stepHeader}>
            <Text style={styles.stepIndicator}>Step 2 of 3</Text>
          </View>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.stepIconCircle}>
              <Ionicons name="person-outline" size={36} color={colors.accent} />
            </View>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepSubtitle}>
              This is how we'll greet you in the app.
            </Text>

            <View style={styles.form}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Alex Johnson"
                placeholderTextColor={colors.textPlaceholder}
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleStep2Next}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={() => setStep(3)}>
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={styles.stepHeader}>
          <Text style={styles.stepIndicator}>Step 3 of 3</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepIconCircle}>
            <Ionicons name="card-outline" size={36} color={colors.accent} />
          </View>
          <Text style={styles.stepTitle}>Add your first account</Text>
          <Text style={styles.stepSubtitle}>
            Set up an account to start tracking your finances.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Account Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Main Checking"
              placeholderTextColor={colors.textPlaceholder}
              value={accountName}
              onChangeText={setAccountName}
            />

            <Text style={styles.label}>Account Type</Text>
            <View style={styles.chipRow}>
              {ACCOUNT_TYPES.map(({ value, label, icon }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.chip,
                    accountType === value && styles.chipActive,
                  ]}
                  onPress={() => setAccountType(value)}
                >
                  <Text style={styles.chipIcon}>{icon}</Text>
                  <Text
                    style={[
                      styles.chipText,
                      accountType === value && styles.chipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Starting Balance</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="number-pad"
              value={balance}
              onChangeText={handleBalanceChange}
              selection={{ start: balance.length, end: balance.length }}
            />

            <Text style={styles.label}>Last 4 Digits (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 4821"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="numeric"
              maxLength={4}
              value={last4}
              onChangeText={setLast4}
            />

            <Text style={styles.label}>Currency</Text>
            <View style={styles.currencyRow}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.currencyChip,
                    currency === c && styles.currencyChipActive,
                  ]}
                  onPress={() => setCurrency(c)}
                >
                  <Text
                    style={[
                      styles.currencyChipText,
                      currency === c && styles.currencyChipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleStep3Next}>
            <Text style={styles.primaryBtnText}>Finish Setup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={finishOnboarding}>
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    logoCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.accentSubtle,
      borderWidth: 2,
      borderColor: colors.accent,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 28,
    },
    appName: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: "800",
      marginBottom: 8,
    },
    tagline: {
      color: colors.accent,
      fontSize: 17,
      fontWeight: "600",
      marginBottom: 14,
      textAlign: "center",
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 48,
      paddingHorizontal: 8,
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignSelf: "stretch",
      alignItems: "center",
      marginTop: 12,
    },
    primaryBtnText: {
      color: colors.onAccent,
      fontSize: 16,
      fontWeight: "700",
    },
    skipBtn: {
      paddingVertical: 14,
      alignSelf: "stretch",
      alignItems: "center",
      marginTop: 4,
    },
    skipBtnText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: "500",
    },
    stepHeader: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 4,
    },
    stepIndicator: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 20,
      alignItems: "center",
    },
    stepIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.accentSubtle,
      borderWidth: 2,
      borderColor: colors.accent,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    stepTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 10,
      textAlign: "center",
    },
    stepSubtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 28,
      paddingHorizontal: 8,
    },
    form: { alignSelf: "stretch", marginBottom: 8 },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: colors.textPrimary,
      fontSize: 15,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 4,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.accentLight,
      borderColor: colors.accent,
    },
    chipIcon: { fontSize: 16 },
    chipText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
    chipTextActive: { color: colors.accent },
    currencyRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 4,
    },
    currencyChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    currencyChipActive: {
      backgroundColor: colors.accentLight,
      borderColor: colors.accent,
    },
    currencyChipText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
    currencyChipTextActive: { color: colors.accent },
  });
}
