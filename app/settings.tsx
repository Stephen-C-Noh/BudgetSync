import { useAppActions, useAppState } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/context/ThemeContext";
import { ensureNotificationPermission } from "@/lib/notifications";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
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
  colors: Colors;
  styles: ReturnType<typeof createStyles>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { userProfile, isLoading, settings } = useAppState();
  const { updateSetting } = useAppActions();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const budgetAlerts =
    settings.find((s) => s.key === "budget_alerts")?.value === "1";
  const weeklyDigest =
    settings.find((s) => s.key === "weekly_digest")?.value === "1";

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
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
        return;
      }
    }
    await updateSetting(key, newValue ? "1" : "0");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginLeft: 15, paddingRight: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.accent} />
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
                  color={colors.accent}
                />
              </View>
              <TouchableOpacity style={styles.editBadge}>
                <MaterialCommunityIcons
                  name="pencil"
                  size={12}
                  color={colors.onAccent}
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
            colors={colors}
            styles={styles}
          />
          <View style={styles.itemDivider} />
          <MenuRow
            icon="globe-outline"
            title="System Language"
            subTitle={userProfile?.language ?? "EN-US"}
            colors={colors}
            styles={styles}
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
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.textPrimary}
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
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>SECURITY</Text>
        <TouchableOpacity style={styles.actionBtn}>
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color={colors.textPrimary}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.actionBtnText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]}>
          <MaterialCommunityIcons
            name="delete-outline"
            size={20}
            color={colors.danger}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.actionBtnText, { color: colors.danger }]}>
            Delete Account
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({ icon, title, subTitle, colors, styles }: MenuRowProps) {
  return (
    <TouchableOpacity style={styles.menuItemRow}>
      <View style={styles.menuLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color={colors.accent} />
        </View>
        <View>
          <Text style={styles.itemTitleText}>{title}</Text>
          {subTitle && <Text style={styles.itemSubText}>{subTitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 15,
    },
    headerTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "700" },
    scrollPadding: { paddingHorizontal: 20 },
    sectionTitle: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1,
      marginTop: 25,
      marginBottom: 12,
    },
    card: { backgroundColor: colors.surface, borderRadius: 20, overflow: "hidden" },
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
      borderColor: colors.accent,
    },
    editBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: colors.accent,
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.surface,
    },
    identityText: { flex: 1, marginLeft: 20 },
    blueLabel: {
      color: colors.accent,
      fontSize: 10,
      fontWeight: "800",
      marginBottom: 4,
    },
    whiteValue: { color: colors.textPrimary, fontSize: 16, fontWeight: "500" },
    lineDivider: { height: 1, backgroundColor: colors.border, marginTop: 8 },
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
      backgroundColor: colors.accentBg,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    itemTitleText: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
    itemSubText: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    itemDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
    },
    actionBtn: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      padding: 18,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    deleteBtn: {
      backgroundColor: "rgba(255, 77, 77, 0.05)",
      borderColor: colors.dangerBorder,
      marginTop: 15,
    },
    actionBtnText: { color: colors.textPrimary, fontWeight: "700", fontSize: 15 },
  });
}
