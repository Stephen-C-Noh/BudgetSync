import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
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
};

export default function AIChatScreen() {
  const [message, setMessage] = useState("");

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>SyncBot AI</Text>

            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>ONLINE ASSISTANT</Text>
            </View>
          </View>

          <Ionicons
            name="information-circle-outline"
            size={22}
            color={COLORS.iconText}
          />
        </View>

        <ScrollView
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.botRow}>
            <View style={styles.botIcon}>
              <MaterialCommunityIcons
                name="robot-outline"
                size={18}
                color={COLORS.accent}
              />
            </View>

            <View style={styles.botGroup}>
              <Text style={styles.senderLabel}>SYNCBOT</Text>

              <View style={styles.botBubble}>
                <Text style={styles.botText}>
                  Hi there! I've finished syncing your latest bank transactions.
                  {"\n\n"}
                  How can I help you with your finances today?
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.userSection}>
            <Text style={styles.userLabel}>YOU</Text>

            <View style={styles.userRow}>
              <View style={styles.userBubble}>
                <Text style={styles.userText}>
                  Am I spending too much on food?
                </Text>
              </View>

              <View style={styles.userIcon}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={COLORS.iconText}
                />
              </View>
            </View>
          </View>

          <View style={styles.botRow}>
            <View style={styles.botIcon}>
              <MaterialCommunityIcons
                name="robot-outline"
                size={18}
                color={COLORS.accent}
              />
            </View>

            <View style={styles.botGroup}>
              <Text style={styles.senderLabel}>SYNCBOT</Text>

              <View style={styles.botBubble}>
                <Text style={styles.botText}>
                  Analyzing your last 30 days...
                  {"\n\n"}
                  You've spent <Text style={styles.highlight}>$450</Text> on
                  groceries and <Text style={styles.highlight}> $200</Text> on
                  dining out. This is{" "}
                  <Text style={styles.redText}>15% higher</Text> than your set
                  budget of $565.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsWrap}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
              <Text style={styles.actionText}>Show breakdown</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
              <Text style={styles.actionText}>Adjust budget</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
              <Text style={styles.actionText}>Compare to last month</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.inputWrapper}>
          <View style={styles.inputBar}>
            <TouchableOpacity activeOpacity={0.8}>
              <Ionicons
                name="add-circle-outline"
                size={22}
                color={COLORS.inputPlaceholder}
              />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Ask about your budget..."
              placeholderTextColor={COLORS.inputPlaceholder}
              value={message}
              onChangeText={setMessage}
            />

            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
              <Ionicons
                name="mic-outline"
                size={20}
                color={COLORS.inputPlaceholder}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendButton} activeOpacity={0.8}>
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
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

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
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: COLORS.success,
  },
  statusText: {
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: "600",
  },

  chatContainer: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },

  botRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },
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
  botGroup: {
    flex: 1,
    maxWidth: "82%",
  },
  senderLabel: {
    color: COLORS.mutedText,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 6,
  },
  botBubble: {
    backgroundColor: COLORS.botBubble,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  botText: {
    color: COLORS.lightText,
    fontSize: 14,
    lineHeight: 24,
  },

  userSection: {
    alignItems: "flex-end",
    marginBottom: 18,
  },
  userLabel: {
    color: COLORS.mutedText,
    fontSize: 10,
    fontWeight: "700",
    marginRight: 44,
    marginBottom: 6,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  userBubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.userBubble,
  },
  userText: {
    color: COLORS.sendIcon,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  userIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.userIconBackground,
  },

  highlight: {
    color: COLORS.accentText,
    fontWeight: "700",
  },
  redText: {
    color: COLORS.danger,
    fontWeight: "700",
  },

  actionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: COLORS.accentButton,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  actionText: {
    color: COLORS.accentText,
    fontSize: 12,
    fontWeight: "500",
  },

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
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.inputBackground,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    marginHorizontal: 10,
  },
  iconButton: {
    marginRight: 8,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.sendButton,
  },
  footerText: {
    color: COLORS.footerText,
    fontSize: 10,
    textAlign: "center",
    marginTop: 8,
  },
});
