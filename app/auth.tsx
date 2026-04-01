import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { authenticate, isBiometricAvailable } from "@/lib/auth";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AuthState = "idle" | "prompting" | "failed" | "unavailable";

export default function AuthScreen() {
  const router = useRouter();
  const { onAuthenticated } = useAuth();
  const [authState, setAuthState] = useState<AuthState>("idle");

  async function triggerAuth() {
    setAuthState("prompting");
    try {
      const available = await isBiometricAvailable();
      if (!available) {
        setAuthState("unavailable");
        return;
      }
      const success = await authenticate("Unlock BudgetSync");
      if (success) {
        onAuthenticated();
        router.replace("/(tabs)");
      } else {
        setAuthState("failed");
      }
    } catch {
      setAuthState("failed");
    }
  }

  useEffect(() => {
    triggerAuth();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="lock-closed" size={48} color="#00D9FF" />
        </View>
        <Text style={styles.title}>BudgetSync</Text>
        <Text style={styles.subtitle}>Verify your identity to continue</Text>

        {authState === "prompting" && (
          <ActivityIndicator color="#00D4FF" size="large" style={{ marginTop: 40 }} />
        )}

        {authState === "idle" && (
          <TouchableOpacity style={styles.actionBtn} onPress={triggerAuth}>
            <Ionicons name="finger-print" size={20} color="#0B1519" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Authenticate</Text>
          </TouchableOpacity>
        )}

        {authState === "failed" && (
          <View style={styles.feedbackBox}>
            <Text style={styles.errorText}>Authentication failed. Please try again.</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={triggerAuth}>
              <Text style={styles.actionBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {authState === "unavailable" && (
          <View style={styles.feedbackBox}>
            <Text style={styles.errorText}>Biometrics not available on this device.</Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                onAuthenticated();
                router.replace("/(tabs)");
              }}
            >
              <Text style={styles.actionBtnText}>Continue Anyway</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1519" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0, 217, 255, 0.08)",
    borderWidth: 2,
    borderColor: "#00D9FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  title: { color: "#FFF", fontSize: 28, fontWeight: "800", marginBottom: 10 },
  subtitle: { color: "#7A869A", fontSize: 15, textAlign: "center", marginBottom: 40 },
  feedbackBox: { alignItems: "center", marginTop: 10 },
  errorText: {
    color: "#FF4D4D",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  actionBtn: {
    backgroundColor: "#00D4FF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  actionBtnText: { color: "#0B1519", fontWeight: "700", fontSize: 16 },
});
