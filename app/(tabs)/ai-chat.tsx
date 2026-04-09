import { useAppState } from "@/context/AppContext";
import { Colors, useTheme } from "@/context/ThemeContext";
import {
  GeminiTurn,
  getGeminiKey,
  saveGeminiKey,
  sendMessage,
  validateGeminiKey,
} from "@/lib/gemini";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
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
  // Pull userProfile to get the dynamic currency
  const { transactions, categories, userProfile } = useAppState();
  const { colors } = useTheme();

  const currency = userProfile?.currency || "CAD";

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
  const styles = useMemo(() => createStyles(colors), [colors]);

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
        categories,
        currency // Passed currency here
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
        <ActivityIndicator color={colors.accent} style={{ flex: 1 }} />
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
                <View style={[styles.statusDot, { backgroundColor: colors.textSecondary }]} />
                <Text style={styles.statusText}>SETUP REQUIRED</Text>
              </View>
            </View>
            <Ionicons name="information-circle-outline" size={22} color={colors.textPrimary} />
          </View>

          <ScrollView
            contentContainerStyle={styles.onboardingContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.onboardingCard}>
              <View style={styles.onboardingIcon}>
                <MaterialCommunityIcons name="robot-outline" size={36} color={colors.accent} />
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
                <Ionicons name="open-outline" size={14} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={styles.studioLinkText}>Get a free key at Google AI Studio</Text>
              </TouchableOpacity>

              <Text style={styles.keyLabel}>Gemini API Key</Text>
              <TextInput
                style={[styles.keyInput, keyError ? styles.keyInputError : null]}
                placeholder="AIza..."
                placeholderTextColor={colors.textPlaceholder}
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
                <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
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
          <Ionicons name="information-circle-outline" size={22} color={colors.textPrimary} />
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
                    <MaterialCommunityIcons name="robot-outline" size={18} color={colors.accent} />
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
                    <Ionicons name="person-outline" size={16} color={colors.textPrimary} />
                  </View>
                </View>
              </View>
            )
          )}

          {isSending && (
            <View style={styles.botRow}>
              <View style={styles.botIcon}>
                <MaterialCommunityIcons name="robot-outline" size={18} color={colors.accent} />
              </View>
              <View style={styles.botGroup}>
                <Text style={styles.senderLabel}>SYNCBOT</Text>
                <View style={styles.botBubble}>
                  <ActivityIndicator color={colors.accent} size="small" />
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
              placeholderTextColor={colors.textPlaceholder}
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
              <Ionicons name="send" size={16} color={colors.onAccent} />
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

function createStyles(colors: Colors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.chatBorder,
      backgroundColor: colors.chatHeader,
    },
    title: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
    statusRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
      backgroundColor: colors.syncConnected,
    },
    statusText: { color: colors.tabBarInactive, fontSize: 11, fontWeight: "600" },

    // Onboarding
    onboardingContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingVertical: 30,
    },
    onboardingCard: {
      backgroundColor: colors.chatCardBg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.chatCardBorder,
      padding: 24,
      alignItems: "center",
    },
    onboardingIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.accentSubtle,
      borderWidth: 1.5,
      borderColor: colors.accent,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 18,
    },
    onboardingTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 10,
    },
    onboardingBody: {
      color: colors.tabBarInactive,
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
      color: colors.accent,
      fontSize: 13,
      textDecorationLine: "underline",
    },
    keyLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "600",
      alignSelf: "flex-start",
      marginBottom: 8,
    },
    keyInput: {
      width: "100%",
      backgroundColor: colors.chatInputBg,
      borderWidth: 1,
      borderColor: colors.chatInputBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.textPrimary,
      fontSize: 14,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    },
    keyInputError: { borderColor: colors.danger },
    keyErrorText: {
      color: colors.danger,
      fontSize: 12,
      marginTop: 8,
      alignSelf: "flex-start",
    },
    connectButton: {
      marginTop: 20,
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 32,
      width: "100%",
      alignItems: "center",
    },
    connectButtonText: { color: colors.onAccent, fontWeight: "700", fontSize: 15 },

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
      backgroundColor: colors.chatBotIconBg,
    },
    botGroup: { flex: 1, maxWidth: "82%" },
    senderLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: "700", marginBottom: 6 },
    botBubble: {
      backgroundColor: colors.chatBotBubble,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 44,
      justifyContent: "center",
    },
    botText: { color: colors.textPrimary, fontSize: 14, lineHeight: 24 },

    userSection: { alignItems: "flex-end", marginBottom: 18 },
    userLabel: {
      color: colors.textSecondary,
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
      backgroundColor: colors.accent,
    },
    userText: { color: colors.onAccent, fontSize: 14, fontWeight: "500", lineHeight: 20 },
    userIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      marginLeft: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.chatUserIconBg,
    },

    actionsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: -8, marginBottom: 18, marginLeft: 46 },
    actionButton: {
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 22,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 10,
      marginBottom: 10,
    },
    actionText: { color: colors.accent, fontSize: 12, fontWeight: "500" },

    // Input
    inputWrapper: {
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 8,
      borderTopWidth: 1,
      borderTopColor: colors.chatBorder,
      backgroundColor: colors.background,
    },
    inputBar: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.chatInputBorder,
      borderRadius: 28,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.chatInputBg,
    },
    input: { flex: 1, color: colors.textPrimary, fontSize: 14, marginRight: 10 },
    sendButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
    },
    sendButtonDisabled: { opacity: 0.4 },
    footerText: {
      color: colors.textSecondary,
      fontSize: 10,
      textAlign: "center",
      marginTop: 8,
    },
  });
}