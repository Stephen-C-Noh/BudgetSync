import { useAppActions, useAppState } from "@/context/AppContext";
import { ensureNotificationPermission } from "@/lib/notifications";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subTitle?: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { userProfile, isLoading, settings } = useAppState();
  const { updateSetting } = useAppActions();

  const budgetAlerts =
    settings.find((s) => s.key === "budget_alerts")?.value === "1";
  const weeklyDigest =
    settings.find((s) => s.key === "weekly_digest")?.value === "1";

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color="#00D4FF" />
      </SafeAreaView>
    );
  }

  async function handleToggle(
    key: "budget_alerts" | "weekly_digest",
    newValue: boolean,
  ) {
    if (newValue) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        Alert.alert(
          "Notifications Disabled",
          "Enable notifications in Settings to use this feature.",
          [
            { text: "Open Settings", onPress: () => Linking.openSettings() },
            { text: "Cancel" },
          ],
        );
        return; // don't save the toggle-on
      }
    }
    await updateSetting(key, newValue ? "1" : "0");
    // update local settings state
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginLeft: 15, paddingRight: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#00D9FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24, marginRight: 15 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPadding}
      >
        <Text style={styles.sectionTitle}>IDENTITY</Text>
        <View style={styles.card}>
          <View style={styles.identityContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <MaterialCommunityIcons
                  name="account"
                  size={40}
                  color="#00D9FF"
                />
              </View>
              <TouchableOpacity style={styles.editBadge}>
                <MaterialCommunityIcons
                  name="pencil"
                  size={12}
                  color="#0B1519"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.identityText}>
              <Text style={styles.blueLabel}>FULL NAME</Text>
              <Text style={styles.whiteValue}>{userProfile?.name ?? "—"}</Text>
              <View style={styles.lineDivider} />
              <Text style={[styles.blueLabel, { marginTop: 12 }]}>
                EMAIL ACCESS
              </Text>
              <Text style={styles.whiteValue}>{userProfile?.email ?? "—"}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>LOCALIZATION</Text>
        <View style={styles.card}>
          <MenuRow
            icon="cash-outline"
            title="Primary Currency"
            subTitle={userProfile?.currency ?? "USD"}
          />
          <View style={styles.itemDivider} />
          <MenuRow
            icon="globe-outline"
            title="System Language"
            subTitle={userProfile?.language ?? "EN-US"}
          />
        </View>

        <Text style={styles.sectionTitle}>ALERTS</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.itemTitleText}>Neural Budget Alerts</Text>
              <Text style={styles.itemSubText}>Notify at 80% threshold</Text>
            </View>
            <Switch
              value={budgetAlerts}
              onValueChange={(val) => handleToggle("budget_alerts", val)}
              trackColor={{ false: "#2A333D", true: "#00D9FF" }}
              thumbColor="#FFF"
            />
          </View>
          <View style={styles.itemDivider} />
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.itemTitleText}>Weekly Sync Digest</Text>
              <Text style={styles.itemSubText}>
                Aggregated performance summary
              </Text>
            </View>
            <Switch
              value={weeklyDigest}
              onValueChange={(val) => handleToggle("weekly_digest", val)}
              trackColor={{ false: "#2A333D", true: "#00D9FF" }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>SECURITY</Text>
        <TouchableOpacity style={styles.actionBtn}>
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color="#FFF"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.actionBtnText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]}>
          <MaterialCommunityIcons
            name="delete-outline"
            size={20}
            color="#FF4D4D"
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.actionBtnText, { color: "#FF4D4D" }]}>
            Delete Account
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({ icon, title, subTitle }: MenuRowProps) {
  return (
    <TouchableOpacity style={styles.menuItemRow}>
      <View style={styles.menuLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color="#00D9FF" />
        </View>
        <View>
          <Text style={styles.itemTitleText}>{title}</Text>
          {subTitle && <Text style={styles.itemSubText}>{subTitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#7A869A" />
    </TouchableOpacity>
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
  scrollPadding: { paddingHorizontal: 20 },
  sectionTitle: {
    color: "#7A869A",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 25,
    marginBottom: 12,
  },
  card: { backgroundColor: "#1C252E", borderRadius: 20, overflow: "hidden" },
  identityContent: { flexDirection: "row", alignItems: "center", padding: 20 },
  avatarContainer: { position: "relative" },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(0, 217, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00D9FF",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#00D9FF",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1C252E",
  },
  identityText: { flex: 1, marginLeft: 20 },
  blueLabel: {
    color: "#00D9FF",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 4,
  },
  whiteValue: { color: "#FFF", fontSize: 16, fontWeight: "500" },
  lineDivider: { height: 1, backgroundColor: "#2A333D", marginTop: 8 },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0, 217, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  itemTitleText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  itemSubText: { color: "#7A869A", fontSize: 12, marginTop: 2 },
  itemDivider: { height: 1, backgroundColor: "#2A333D", marginHorizontal: 16 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  actionBtn: {
    flexDirection: "row",
    backgroundColor: "#1C252E",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2A333D",
  },
  deleteBtn: {
    backgroundColor: "rgba(255, 77, 77, 0.05)",
    borderColor: "rgba(255, 77, 77, 0.2)",
    marginTop: 15,
  },
  actionBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
