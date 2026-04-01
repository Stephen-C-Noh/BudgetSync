import { Ionicons } from "@expo/vector-icons";
import { useAppActions, useAppState } from "@/context/AppContext";
import { getSupabaseUser, pullAccounts, pullTransactions, pushAccounts, pushTransactions } from "@/lib/supabase";
import { getUnsyncedTransactions, markTransactionSynced, upsertAccount, upsertTransaction } from "@/lib/db";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "KRW", "CAD", "AUD"];

export default function SyncLoginScreen() {
  const router = useRouter();
  const { syncUser, accounts, userProfile } = useAppState();
  const { loginSync, signUpSync, logoutSync, reloadAll, updateUserProfile } = useAppActions();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setStatusMessage(null);
    setIsLoading(true);
    try {
      const err =
        mode === "signin"
          ? await loginSync(email.trim(), password)
          : await signUpSync(email.trim(), password);

      if (err) {
        setError(err);
        setIsLoading(false);
        return;
      }

      // Check if session is active (email confirmation may be required)
      const user = await getSupabaseUser();
      if (!user) {
        setIsLoading(false);
        setError("Check your email and confirm your account, then sign in.");
        return;
      }

      // On signup: update local profile with entered details
      if (mode === "signup" && userProfile) {
        await updateUserProfile({
          ...userProfile,
          name: name.trim(),
          email: user.email,
          currency,
        });
      }

      // Push local data to Supabase
      setStatusMessage("Syncing your data…");
      const unsynced = await getUnsyncedTransactions();
      await Promise.all([
        pushAccounts(accounts, user.id),
        pushTransactions(unsynced, user.id),
      ]);
      for (const t of unsynced) await markTransactionSynced(t.id);

      // Pull remote data (merges any data from other devices)
      const [remoteTxs, remoteAccs] = await Promise.all([
        pullTransactions(user.id),
        pullAccounts(user.id),
      ]);
      for (const t of remoteTxs) await upsertTransaction(t);
      for (const a of remoteAccs) await upsertAccount(a);
      await reloadAll();
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
      setStatusMessage(null);
    }
  }

  async function handleLogout() {
    setIsLoading(true);
    await logoutSync();
    setIsLoading(false);
    router.back();
  }

  // ── Connected state ──────────────────────────────────────────────────────────
  if (syncUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#00D9FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cloud Sync</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.connectedCard}>
          <View style={styles.connectedIconRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="cloud-done" size={32} color="#00D9FF" />
            </View>
            <View style={styles.dot} />
          </View>
          <Text style={styles.connectedLabel}>CONNECTED</Text>
          <Text style={styles.connectedEmail}>{syncUser.email}</Text>
          <Text style={styles.connectedSub}>
            Your transactions sync automatically each time you open the app.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.disconnectBtn}
          onPress={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FF6B6B" />
          ) : (
            <Text style={styles.disconnectText}>Disconnect</Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Login / Signup state ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#00D9FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cloud Sync</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="cloud-outline" size={40} color="#00D9FF" />
          </View>
          <Text style={styles.title}>Back up your data</Text>
          <Text style={styles.subtitle}>
            {mode === "signin"
              ? "Sign in to restore and sync your data across devices."
              : "Create an account to back up and sync your transactions."}
          </Text>

          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "signin" && styles.modeBtnActive]}
              onPress={() => { setMode("signin"); setError(null); }}
            >
              <Text style={[styles.modeBtnText, mode === "signin" && styles.modeBtnTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "signup" && styles.modeBtnActive]}
              onPress={() => { setMode("signup"); setError(null); }}
            >
              <Text style={[styles.modeBtnText, mode === "signup" && styles.modeBtnTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* Name — signup only */}
            {mode === "signup" && (
              <>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Alex Johnson"
                  placeholderTextColor="#4A5568"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                />
              </>
            )}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#4A5568"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#4A5568"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#7A869A" />
              </TouchableOpacity>
            </View>

            {/* Currency — signup only */}
            {mode === "signup" && (
              <>
                <Text style={styles.label}>Currency</Text>
                <View style={styles.currencyRow}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.currencyChip, currency === c && styles.currencyChipActive]}
                      onPress={() => setCurrency(c)}
                    >
                      <Text style={[styles.currencyChipText, currency === c && styles.currencyChipTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {statusMessage && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#00D9FF" />
              <Text style={styles.statusText}>{statusMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading && !statusMessage ? (
              <ActivityIndicator color="#0B1519" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, alignItems: "center" },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,217,255,0.08)",
    borderWidth: 2,
    borderColor: "#00D9FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { color: "#FFF", fontSize: 22, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  subtitle: {
    color: "#7A869A",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#1C252E",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    alignSelf: "stretch",
  },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  modeBtnActive: { backgroundColor: "#00D9FF" },
  modeBtnText: { color: "#7A869A", fontWeight: "600", fontSize: 15 },
  modeBtnTextActive: { color: "#0B1519" },
  form: { alignSelf: "stretch", marginBottom: 8 },
  label: { color: "#7A869A", fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#1C252E",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#FFF",
    fontSize: 15,
  },
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
    backgroundColor: "#1C252E",
    borderWidth: 1,
    borderColor: "#2A333D",
  },
  currencyChipActive: {
    backgroundColor: "rgba(0,217,255,0.12)",
    borderColor: "#00D9FF",
  },
  currencyChipText: { color: "#7A869A", fontSize: 14, fontWeight: "600" },
  currencyChipTextActive: { color: "#00D9FF" },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C252E",
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#FFF",
    fontSize: 15,
  },
  eyeBtn: { paddingHorizontal: 14 },
  errorText: { color: "#FF6B6B", fontSize: 13, textAlign: "center", marginTop: 8, alignSelf: "stretch" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  statusText: { color: "#7A869A", fontSize: 13 },
  submitBtn: {
    backgroundColor: "#00D9FF",
    borderRadius: 14,
    paddingVertical: 16,
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 24,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#0B1519", fontSize: 16, fontWeight: "700" },
  // Connected state
  connectedCard: {
    margin: 24,
    backgroundColor: "#1C252E",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },
  connectedIconRow: { position: "relative", marginBottom: 16 },
  dot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#00C48C",
    borderWidth: 2,
    borderColor: "#1C252E",
  },
  connectedLabel: { color: "#00C48C", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8 },
  connectedEmail: { color: "#FFF", fontSize: 17, fontWeight: "700", marginBottom: 10 },
  connectedSub: { color: "#7A869A", fontSize: 14, textAlign: "center", lineHeight: 20 },
  disconnectBtn: {
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: "#FF6B6B",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  disconnectText: { color: "#FF6B6B", fontSize: 15, fontWeight: "600" },
});
