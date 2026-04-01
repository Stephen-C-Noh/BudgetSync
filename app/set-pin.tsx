import { Ionicons } from "@expo/vector-icons";
import { useAppActions } from "@/context/AppContext";
import { authenticate, isBiometricAvailable, setPIN } from "@/lib/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PIN_LENGTH = 4;
const NUMPAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "del"],
];

type Stage = "enter" | "confirm";

export default function SetPinScreen() {
  const router = useRouter();
  const { updateSetting } = useAppActions();
  const [stage, setStage] = useState<Stage>("enter");
  const [firstPin, setFirstPin] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleDigit(digit: string) {
    if (isSaving || pin.length >= PIN_LENGTH) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError("");
    if (newPin.length === PIN_LENGTH) {
      handlePinComplete(newPin);
    }
  }

  function handleDelete() {
    setPin((p) => p.slice(0, -1));
    setError("");
  }

  function handlePinComplete(entered: string) {
    if (stage === "enter") {
      setFirstPin(entered);
      setPin("");
      setStage("confirm");
    } else {
      if (entered === firstPin) {
        completeEnrollment(entered);
      } else {
        setError("PINs don't match. Start over.");
        setPin("");
        setFirstPin("");
        setStage("enter");
      }
    }
  }

  async function completeEnrollment(confirmedPin: string) {
    setIsSaving(true);
    await setPIN(confirmedPin);

    // Optionally confirm biometrics work — proceed regardless of result
    const available = await isBiometricAvailable();
    if (available) {
      await authenticate("Confirm to enable biometrics");
    }

    await updateSetting("biometrics_enabled", "true");
    router.back();
  }

  const title = stage === "enter" ? "Create PIN" : "Confirm PIN";
  const subtitle =
    stage === "enter"
      ? "Set a 4-digit PIN as your backup unlock method"
      : "Re-enter your PIN to confirm";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#00D9FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Setup</Text>
        <View style={{ width: 24, marginRight: 15 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="keypad" size={40} color="#00D9FF" />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* PIN dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < pin.length && styles.dotFilled]}
            />
          ))}
        </View>

        {error !== "" && <Text style={styles.errorText}>{error}</Text>}

        {isSaving ? (
          <ActivityIndicator color="#00D4FF" size="large" style={{ marginTop: 40 }} />
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1519" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  backBtn: { marginLeft: 15, paddingRight: 10 },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },

  content: { flex: 1, alignItems: "center", paddingTop: 30, paddingHorizontal: 30 },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 217, 255, 0.08)",
    borderWidth: 2,
    borderColor: "#00D9FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: { color: "#FFF", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  subtitle: { color: "#7A869A", fontSize: 14, textAlign: "center", marginBottom: 36 },

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

  errorText: { color: "#FF4D4D", fontSize: 13, marginBottom: 12, textAlign: "center" },

  numpad: { marginTop: 24, width: "100%", maxWidth: 300 },
  numpadRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
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
