import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppActions, useAppState } from "@/context/AppContext";
import { clearPIN } from "@/lib/auth";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SimpleLinkProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}

export default function MoreScreen() {
  const router = useRouter();
  const { userProfile, settings, syncUser } = useAppState();
  const { updateSetting } = useAppActions();

  const isBiometricsEnabled =
    settings.find((s) => s.key === "biometrics_enabled")?.value === "true";

  async function handleBiometricsToggle(value: boolean) {
    if (value) {
      // Enrollment handled by set-pin screen (sets PIN, tries biometrics, saves setting)
      router.push("/set-pin");
    } else {
      await clearPIN();
      await updateSetting("biometrics_enabled", "false");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        <Text style={styles.mainTitle}>More</Text>

        <View style={styles.card}>
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircleLarge}>
                <MaterialCommunityIcons name="account" size={48} color="#00D9FF" />
              </View>
              <TouchableOpacity style={styles.editBadgeLarge}>
                <MaterialCommunityIcons name="pencil" size={14} color="#0B1519" />
              </TouchableOpacity>
            </View>
            <View style={{ marginLeft: 20 }}>
              <Text style={styles.profileName}>{userProfile?.name ?? "—"}</Text>
              <Text style={styles.profileEmail}>{userProfile?.email ?? "—"}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.card}>
          <SimpleLink
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push("/settings")}
          />
          <View style={styles.itemDivider} />
          <SimpleLink
            icon="shapes-outline"
            label="Category Settings"
            onPress={() => router.push("/category-settings")}
          />
          <View style={styles.itemDivider} />
          <SimpleLink
            icon="speedometer-outline"
            label="Budget Goals"
            onPress={() => router.push("/budget-goals")}
          />
        </View>

        <Text style={styles.sectionTitle}>PRIVACY & SECURITY</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.menuLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="finger-print" size={20} color="#00D9FF" />
              </View>
              <View>
                <Text style={styles.itemTitleText}>Security (Biometrics)</Text>
                <Text style={styles.itemSubText}>Use Face ID or Touch ID</Text>
              </View>
            </View>
            <Switch
              value={isBiometricsEnabled}
              onValueChange={handleBiometricsToggle}
              trackColor={{ false: "#2A333D", true: "#00D9FF" }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>CLOUD SYNC</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => router.push("/sync-login")}
          >
            <View style={styles.menuLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="cloud-outline" size={20} color="#00D9FF" />
              </View>
              <View>
                <Text style={styles.itemTitleText}>Cloud Sync</Text>
                <Text style={styles.itemSubText}>
                  {syncUser ? syncUser.email : "Not connected"}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {syncUser && <View style={styles.syncDot} />}
              <Ionicons name="chevron-forward" size={18} color="#7A869A" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>RESOURCES</Text>
        <View style={styles.card}>
          <SimpleLink icon="help-circle-outline" label="Help & Support" />
          <View style={styles.itemDivider} />
          <SimpleLink icon="chatbubble-ellipses-outline" label="Feedback" />
          <View style={styles.itemDivider} />
          <SimpleLink icon="information-circle-outline" label="About" />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SimpleLink({ icon, label, onPress }: SimpleLinkProps) {
  return (
    <TouchableOpacity style={styles.menuItemRow} onPress={onPress}>
      <View style={styles.menuLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color="#00D9FF" />
        </View>
        <Text style={styles.itemTitleText}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#7A869A" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1519" },
  scrollPadding: { paddingHorizontal: 20 },
  mainTitle: { color: "#FFF", fontSize: 24, fontWeight: "700", marginTop: 10, marginBottom: 20 },
  sectionTitle: { color: "#7A869A", fontSize: 12, fontWeight: "800", letterSpacing: 1, marginTop: 25, marginBottom: 12 },
  card: { backgroundColor: "#1C252E", borderRadius: 20, overflow: "hidden" },
  profileContent: { flexDirection: "row", alignItems: "center", padding: 20 },
  avatarContainer: { position: "relative" },
  avatarCircleLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(0, 217, 255, 0.05)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#00D9FF" },
  editBadgeLarge: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#00D9FF", width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#1C252E" },
  menuItemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0, 217, 255, 0.1)", justifyContent: "center", alignItems: "center", marginRight: 15 },
  itemTitleText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  itemSubText: { color: "#7A869A", fontSize: 12, marginTop: 2 },
  profileName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  profileEmail: { color: "#7A869A", fontSize: 14, marginTop: 4 },
  itemDivider: { height: 1, backgroundColor: "#2A333D", marginHorizontal: 16 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#00C48C" },
});
