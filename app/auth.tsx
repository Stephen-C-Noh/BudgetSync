import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { authenticate, hasPIN, isBiometricAvailable, verifyPIN } from "@/lib/auth";
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

const PIN_LENGTH = 4;
const MAX_BIO_FAILURES = 3;

const NUMPAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "del"],
];

type Screen = "biometric" | "pin";

export default function AuthScreen() {
  const router = useRouter();
  const { onAuthenticated } = useAuth();

  const [screen, setScreen] = useState<Screen>("biometric");
  const [isPrompting, setIsPrompting] = useState(false);
  const [bioFailures, setBioFailures] = useState(0);
  const [bioError, setBioError] = useState("");

  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [noPinSet, setNoPinSet] = useState(false);

  // ─── Biometric ───────────────────────────────────────────

  async function triggerBiometric() {
    setBioError("");
    setIsPrompting(true);
    try {
      const available = await isBiometricAvailable();
      if (!available) {
        setIsPrompting(false);
        switchToPin();
        return;
      }
      const success = await authenticate("Unlock BudgetSync");
      setIsPrompting(false);
      if (success) {
        succeed();
      } else {
        const newCount = bioFailures + 1;
        setBioFailures(newCount);
        if (newCount >= MAX_BIO_FAILURES) {
          switchToPin();
        } else {
          setBioError(
            `Authentication failed. ${MAX_BIO_FAILURES - newCount} attempt${MAX_BIO_FAILURES - newCount === 1 ? "" : "s"} remaining.`
          );
        }
      }
    } catch {
      setIsPrompting(false);
      setBioFailures((n) => n + 1);
      setBioError("An error occurred. Please try again.");
    }
  }

  async function switchToPin() {
    const pinExists = await hasPIN();
    if (!pinExists) {
      setNoPinSet(true);
    }
    setScreen("pin");
  }

  // ─── PIN ─────────────────────────────────────────────────

  function handleDigit(digit: string) {
    if (isVerifying || pin.length >= PIN_LENGTH) return;
    const newPin = pin + digit;
    setPin(newPin);
    setPinError("");
    if (newPin.length === PIN_LENGTH) {
      checkPin(newPin);
    }
  }

  function handleDelete() {
    setPin((p) => p.slice(0, -1));
    setPinError("");
  }

  async function checkPin(entered: string) {
    setIsVerifying(true);
    try {
      const valid = await verifyPIN(entered);
      if (valid) {
        succeed();
      } else {
        setPinError("Incorrect PIN. Please try again.");
        setPin("");
      }
    } catch {
      setPinError("Could not verify PIN. Please try again.");
      setPin("");
    } finally {
      setIsVerifying(false);
    }
  }

  // ─── Success ─────────────────────────────────────────────

  function succeed() {
    onAuthenticated();
    router.replace("/(tabs)");
  }

  // ─── On mount: trigger biometrics automatically ───────────

  useEffect(() => {
    triggerBiometric();
  }, []);

  // ─── Render ──────────────────────────────────────────────

  if (screen === "pin") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <Ionicons name="keypad" size={40} color="#00D9FF" />
          </View>
          <Text style={styles.title}>Enter PIN</Text>
          <Text style={styles.subtitle}>Enter your 4-digit PIN to unlock BudgetSync</Text>

          {noPinSet ? (
            <View style={styles.feedbackBox}>
              <Text style={styles.errorText}>
                No PIN has been set up. Please disable and re-enable Security in the More screen.
              </Text>
            </View>
          ) : (
            <>
              {/* PIN dots */}
              <View style={styles.dotsRow}>
                {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i < pin.length && styles.dotFilled]}
                  />
                ))}
              </View>

              {pinError !== "" && (
                <Text style={styles.errorText}>{pinError}</Text>
              )}

              {isVerifying ? (
                <ActivityIndicator
                  color="#00D4FF"
                  size="large"
                  style={{ marginTop: 40 }}
                />
              ) : (
                <View style={styles.numpad}>
                  {NUMPAD.map((row, rowIdx) => (
                    <View key={rowIdx} style={styles.numpadRow}>
                      {row.map((key, colIdx) => {
                        if (key === "") {
                          return <View key={colIdx} style={styles.numpadKeyEmpty} />;
                        }
                        if (key === "del") {
                          return (
                            <TouchableOpacity
                              key={colIdx}
                              style={styles.numpadKey}
                              onPress={handleDelete}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="backspace-outline" size={24} color="#FFF" />
                            </TouchableOpacity>
                          );
                        }
                        return (
                          <TouchableOpacity
                            key={colIdx}
                            style={styles.numpadKey}
                            onPress={() => handleDigit(key)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.numpadKeyText}>{key}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Biometric screen
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="finger-print" size={48} color="#00D9FF" />
        </View>
        <Text style={styles.title}>BudgetSync</Text>
        <Text style={styles.subtitle}>Verify your identity to continue</Text>

        {isPrompting && (
          <ActivityIndicator
            color="#00D4FF"
            size="large"
            style={{ marginTop: 40 }}
          />
        )}

        {!isPrompting && bioError !== "" && (
          <View style={styles.feedbackBox}>
            <Text style={styles.errorText}>{bioError}</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={triggerBiometric}>
              <Text style={styles.actionBtnText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pinFallbackBtn}
              onPress={switchToPin}
            >
              <Text style={styles.pinFallbackText}>Use PIN instead</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isPrompting && bioError === "" && (
          <TouchableOpacity style={styles.actionBtn} onPress={triggerBiometric}>
            <Ionicons
              name="finger-print"
              size={20}
              color="#0B1519"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.actionBtnText}>Authenticate</Text>
          </TouchableOpacity>
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
  subtitle: {
    color: "#7A869A",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 40,
  },
  feedbackBox: { alignItems: "center" },
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
    marginTop: 8,
  },
  actionBtnText: { color: "#0B1519", fontWeight: "700", fontSize: 16 },
  pinFallbackBtn: { marginTop: 16, padding: 8 },
  pinFallbackText: { color: "#7A869A", fontSize: 14, textDecorationLine: "underline" },

  // PIN screen
  dotsRow: { flexDirection: "row", gap: 20, marginBottom: 16 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#00D9FF",
    backgroundColor: "transparent",
  },
  dotFilled: { backgroundColor: "#00D9FF" },
  numpad: { marginTop: 24, width: "100%", maxWidth: 300 },
  numpadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  numpadKey: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1C252E",
    justifyContent: "center",
    alignItems: "center",
  },
  numpadKeyEmpty: { width: 80, height: 80 },
  numpadKeyText: { color: "#FFF", fontSize: 24, fontWeight: "600" },
});
