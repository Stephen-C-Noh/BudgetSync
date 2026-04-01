import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppState } from "@/context/AppContext";
import {
  GeminiTurn,
  getGeminiKey,
  saveGeminiKey,
  sendMessage,
  validateGeminiKey,
} from "@/lib/gemini";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  background: "#071420",
  headerBackground: "#0A1B28",
  border: "#143042",
  inputBorder: "#123650",
  inputBackground: "#0B1830",
  botIconBackground: "#083243",
  botBubble: "#202B46",
  userBubble: "#12CFFB",
  userIconBackground: "#374760",
  white: "#FFFFFF",
  lightText: "#E7EEF5",
  mutedText: "#7D90A3",
  secondaryText: "#A9B8C8",
  footerText: "#6F8397",
  iconText: "#D4DEE7",
  accent: "#00D1FF",
  accentButton: "#00BEEA",
  accentText: "#00CFF8",
  sendButton: "#00CFF8",
  sendIcon: "#02131E",
  success: "#22D39A",
  inputPlaceholder: "#7F93A7",
  danger: "#FF4D6D",
  cardBg: "#0E2030",
  cardBorder: "#1A3A50",
};

type Message = {
  id: string;
  role: "bot" | "user";
  text: string;
  chips?: string[];
};

const GREETING = "Hi! I'm SyncBot, your personal finance assistant. I can see your recent transactions and spending patterns. How can I help you today?";
const GREETING_CHIPS = ["Am I on budget?", "Where am I spending most?", "How to save more?"];
const FOLLOW_UP_CHIPS = ["Tell me more", "Show breakdown", "Any tips?"];

export default function AIChatScreen() {
  const { transactions, categories } = useAppState();

  // Key management
  const [keyChecked, setKeyChecked] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [keyError, setKeyError] = useState("");

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const geminiHistory = useRef<GeminiTurn[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    getGeminiKey().then((key) => {
      const exists = key !== null && key.length > 0;
      setHasKey(exists);
      setKeyChecked(true);
      if (exists) {
        setMessages([
          {
            id: "greeting",
            role: "bot",
            text: GREETING,
            chips: GREETING_CHIPS,
          },
        ]);
      }
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages]);

  async function handleValidateKey() {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      setKeyError("Please enter your API key.");
      return;
    }
    setIsValidating(true);
    setKeyError("");
    const error = await validateGeminiKey(trimmed);
    if (error === null) {
      await saveGeminiKey(trimmed);
      setHasKey(true);
      setMessages([
        {
          id: "greeting",
          role: "bot",
          text: GREETING,
          chips: GREETING_CHIPS,
        },
      ]);
    } else {
      setKeyError(error);
    }
    setIsValidating(false);
  }

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setInput("");
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const reply = await sendMessage(
        trimmed,
        geminiHistory.current,
        transactions,
        categories
      );
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        role: "bot",
        text: reply,
        chips: FOLLOW_UP_CHIPS,
      };
      setMessages((prev) => [...prev, botMsg]);
      geminiHistory.current = [
        ...geminiHistory.current,
        { role: "user", parts: [{ text: trimmed }] },
        { role: "model", parts: [{ text: reply }] },
      ];
    } catch (err: unknown) {
      const isInvalidKey =
        err instanceof Error && err.message === "INVALID_KEY";
      const detail =
        err instanceof Error && err.message !== "INVALID_KEY"
          ? err.message
          : null;
      const errorMsg: Message = {
        id: `e-${Date.now()}`,
        role: "bot",
        text: isInvalidKey
          ? "Your API key appears to be invalid. Please disable and re-enable the AI connection in settings."
          : `Something went wrong: ${detail ?? "unknown error"}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  }

  if (!keyChecked) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={COLORS.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!hasKey) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>SyncBot AI</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.mutedText }]} />
              <Text style={styles.statusText}>SETUP REQUIRED</Text>
            </View>
          </View>
          <Ionicons name="information-circle-outline" size={22} color={COLORS.iconText} />
        </View>

        <ScrollView
          contentContainerStyle={styles.onboardingContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.onboardingCard}>
            <View style={styles.onboardingIcon}>
              <MaterialCommunityIcons name="robot-outline" size={36} color={COLORS.accent} />
            </View>
            <Text style={styles.onboardingTitle}>Connect SyncBot AI</Text>
            <Text style={styles.onboardingBody}>
              SyncBot uses Google Gemini to answer questions about your finances. Your API key is stored securely on this device and never shared.
            </Text>

            <TouchableOpacity
              style={styles.studioLink}
              onPress={() => Linking.openURL("https://aistudio.google.com/apikey")}
              activeOpacity={0.7}
            >
              <Ionicons name="open-outline" size={14} color={COLORS.accentText} style={{ marginRight: 6 }} />
              <Text style={styles.studioLinkText}>Get a free key at Google AI Studio</Text>
            </TouchableOpacity>

            <Text style={styles.keyLabel}>Gemini API Key</Text>
            <TextInput
              style={[styles.keyInput, keyError ? styles.keyInputError : null]}
              placeholder="AIza..."
              placeholderTextColor={COLORS.inputPlaceholder}
              value={keyInput}
              onChangeText={(v) => {
                setKeyInput(v);
                setKeyError("");
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {keyError !== "" && (
              <Text style={styles.keyErrorText}>{keyError}</Text>
            )}

            {isValidating ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
            ) : (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={handleValidateKey}
                activeOpacity={0.85}
              >
                <Text style={styles.connectButtonText}>Validate & Connect</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>SyncBot AI</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>ONLINE ASSISTANT</Text>
            </View>
          </View>
          <Ionicons name="information-circle-outline" size={22} color={COLORS.iconText} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) =>
            msg.role === "bot" ? (
              <View key={msg.id}>
                <View style={styles.botRow}>
                  <View style={styles.botIcon}>
                    <MaterialCommunityIcons name="robot-outline" size={18} color={COLORS.accent} />
                  </View>
                  <View style={styles.botGroup}>
                    <Text style={styles.senderLabel}>SYNCBOT</Text>
                    <View style={styles.botBubble}>
                      <Text style={styles.botText}>{msg.text}</Text>
                    </View>
                  </View>
                </View>
                {msg.chips && msg.chips.length > 0 && (
                  <View style={styles.actionsWrap}>
                    {msg.chips.map((chip) => (
                      <TouchableOpacity
                        key={chip}
                        style={styles.actionButton}
                        onPress={() => handleSend(chip)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionText}>{chip}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View key={msg.id} style={styles.userSection}>
                <Text style={styles.userLabel}>YOU</Text>
                <View style={styles.userRow}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{msg.text}</Text>
                  </View>
                  <View style={styles.userIcon}>
                    <Ionicons name="person-outline" size={16} color={COLORS.iconText} />
                  </View>
                </View>
              </View>
            )
          )}

          {isSending && (
            <View style={styles.botRow}>
              <View style={styles.botIcon}>
                <MaterialCommunityIcons name="robot-outline" size={18} color={COLORS.accent} />
              </View>
              <View style={styles.botGroup}>
                <Text style={styles.senderLabel}>SYNCBOT</Text>
                <View style={styles.botBubble}>
                  <ActivityIndicator color={COLORS.accent} size="small" />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputWrapper}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Ask about your budget..."
              placeholderTextColor={COLORS.inputPlaceholder}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => handleSend(input)}
              returnKeyType="send"
              editable={!isSending}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || isSending) && styles.sendButtonDisabled]}
              onPress={() => handleSend(input)}
              activeOpacity={0.8}
              disabled={!input.trim() || isSending}
            >
              <Ionicons name="send" size={16} color={COLORS.sendIcon} />
            </TouchableOpacity>
          </View>
          <Text style={styles.footerText}>
            AI CAN MAKE MISTAKES. CHECK YOUR STATEMENTS FOR ACCURACY.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.headerBackground,
  },
  title: { color: COLORS.white, fontSize: 18, fontWeight: "700" },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: COLORS.success,
  },
  statusText: { color: COLORS.secondaryText, fontSize: 11, fontWeight: "600" },

  // Onboarding
  onboardingContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  onboardingCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 24,
    alignItems: "center",
  },
  onboardingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0, 209, 255, 0.08)",
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  onboardingTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  onboardingBody: {
    color: COLORS.secondaryText,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 18,
  },
  studioLink: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  studioLinkText: {
    color: COLORS.accentText,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  keyLabel: {
    color: COLORS.mutedText,
    fontSize: 12,
    fontWeight: "600",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  keyInput: {
    width: "100%",
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  keyInputError: { borderColor: COLORS.danger },
  keyErrorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  connectButton: {
    marginTop: 20,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  connectButtonText: { color: COLORS.sendIcon, fontWeight: "700", fontSize: 15 },

  // Chat
  chatContainer: { flex: 1 },
  chatContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 20 },

  botRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 18 },
  botIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginTop: 18,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.botIconBackground,
  },
  botGroup: { flex: 1, maxWidth: "82%" },
  senderLabel: { color: COLORS.mutedText, fontSize: 10, fontWeight: "700", marginBottom: 6 },
  botBubble: {
    backgroundColor: COLORS.botBubble,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  botText: { color: COLORS.lightText, fontSize: 14, lineHeight: 24 },

  userSection: { alignItems: "flex-end", marginBottom: 18 },
  userLabel: {
    color: COLORS.mutedText,
    fontSize: 10,
    fontWeight: "700",
    marginRight: 44,
    marginBottom: 6,
  },
  userRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  userBubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.userBubble,
  },
  userText: { color: COLORS.sendIcon, fontSize: 14, fontWeight: "500", lineHeight: 20 },
  userIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.userIconBackground,
  },

  actionsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: -8, marginBottom: 18, marginLeft: 46 },
  actionButton: {
    borderWidth: 1,
    borderColor: COLORS.accentButton,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  actionText: { color: COLORS.accentText, fontSize: 12, fontWeight: "500" },

  // Input
  inputWrapper: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.inputBackground,
  },
  input: { flex: 1, color: COLORS.white, fontSize: 14, marginRight: 10 },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.sendButton,
  },
  sendButtonDisabled: { opacity: 0.4 },
  footerText: {
    color: COLORS.footerText,
    fontSize: 10,
    textAlign: "center",
    marginTop: 8,
  },
});
