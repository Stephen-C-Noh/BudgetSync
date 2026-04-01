import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const APP_VERSION = "1.0.0";

const BUILT_WITH = [
  { icon: "logo-react" as const, label: "React Native & Expo" },
  { icon: "server-outline" as const, label: "Supabase (Cloud Sync)" },
  { icon: "hardware-chip-outline" as const, label: "SQLite (Local Storage)" },
  { icon: "lock-closed-outline" as const, label: "Expo Secure Store" },
  { icon: "sparkles-outline" as const, label: "Google Gemini AI" },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15, paddingRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#00D9FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 24, marginRight: 15 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* App identity */}
        <View style={styles.heroCard}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="wallet" size={48} color="#00D9FF" />
          </View>
          <Text style={styles.appName}>BudgetSync</Text>
          <Text style={styles.tagline}>Personal finance, simplified.</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version {APP_VERSION}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.descriptionText}>
            BudgetSync helps you track income and expenses, manage multiple accounts, set budget goals, and get AI-powered financial insights — all from your phone. Your data stays on-device by default and syncs to the cloud only when you choose to.
          </Text>
        </View>

        {/* Built with */}
        <Text style={styles.sectionTitle}>BUILT WITH</Text>
        <View style={styles.card}>
          {BUILT_WITH.map((item, index) => (
            <View key={item.label}>
              <View style={styles.techRow}>
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon} size={20} color="#00D9FF" />
                </View>
                <Text style={styles.techLabel}>{item.label}</Text>
              </View>
              {index < BUILT_WITH.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Legal */}
        <Text style={styles.sectionTitle}>LEGAL</Text>
        <View style={styles.card}>
          <View style={styles.legalRow}>
            <Text style={styles.legalKey}>License</Text>
            <Text style={styles.legalValue}>MIT</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.legalRow}>
            <Text style={styles.legalKey}>Data Storage</Text>
            <Text style={styles.legalValue}>On-device (SQLite)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.legalRow}>
            <Text style={styles.legalKey}>Cloud Provider</Text>
            <Text style={styles.legalValue}>Supabase</Text>
          </View>
        </View>

        {/* Developers */}
        <Text style={styles.sectionTitle}>DEVELOPERS</Text>
        <View style={styles.card}>
          {[
            { name: "Stephen Changbeom Noh", github: "https://github.com/Stephen-C-Noh" },
            { name: "Anthony Nwachukwu Ogamba", github: "https://github.com/AnthonyOgamba" },
            { name: "Fathema Begum Ema", github: "https://github.com/fathema25" },
          ].map((dev, index, arr) => (
            <View key={dev.name}>
              <TouchableOpacity style={styles.devRow} onPress={() => Linking.openURL(dev.github)} activeOpacity={0.7}>
                <View style={styles.devAvatar}>
                  <MaterialCommunityIcons name="account" size={22} color="#00D9FF" />
                </View>
                <View style={styles.devInfo}>
                  <Text style={styles.devName}>{dev.name}</Text>
                  <Text style={styles.devGithub}>{dev.github.replace("https://", "")}</Text>
                </View>
                <Ionicons name="logo-github" size={20} color="#7A869A" />
              </TouchableOpacity>
              {index < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <Text style={styles.footerText}>© {new Date().getFullYear()} BudgetSync</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  scroll: { paddingHorizontal: 20 },

  heroCard: {
    backgroundColor: "#1C252E",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    marginBottom: 16,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(0, 217, 255, 0.08)",
    borderWidth: 2,
    borderColor: "#00D9FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: { color: "#FFF", fontSize: 28, fontWeight: "800", marginBottom: 6 },
  tagline: { color: "#7A869A", fontSize: 14, marginBottom: 16 },
  versionBadge: {
    backgroundColor: "rgba(0, 217, 255, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(0, 217, 255, 0.25)",
  },
  versionText: { color: "#00D9FF", fontSize: 12, fontWeight: "700" },

  card: { backgroundColor: "#1C252E", borderRadius: 20, overflow: "hidden", marginBottom: 16 },

  descriptionText: {
    color: "#A0AABB",
    fontSize: 14,
    lineHeight: 22,
    padding: 20,
  },

  sectionTitle: {
    color: "#7A869A",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },

  techRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0, 217, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  techLabel: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#2A333D", marginHorizontal: 16 },

  legalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  legalKey: { color: "#7A869A", fontSize: 14 },
  legalValue: { color: "#FFF", fontSize: 14, fontWeight: "600" },

  footerText: { color: "#3A4A5A", fontSize: 12, textAlign: "center", marginTop: 8 },
  devRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  devAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 217, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 217, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  devInfo: { flex: 1 },
  devName: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  devGithub: { color: "#7A869A", fontSize: 12, marginTop: 2 },
});
