import EditNameModal from "@/components/shared/EditNameModal";
import { useAppActions, useAppState } from "@/context/AppContext";
import { Colors, useTheme } from "@/context/ThemeContext";
import { clearPIN } from "@/lib/auth";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SimpleLinkProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}

export default function MoreScreen() {
  const router = useRouter();
  const { userProfile, settings, syncUser } = useAppState();
  const { updateSetting, updateUserProfile } = useAppActions();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const isBiometricsEnabled =
    settings.find((s) => s.key === "biometrics_enabled")?.value === "true";

  async function handleBiometricsToggle(value: boolean) {
    if (value) {
      router.push("/set-pin");
    } else {
      await clearPIN();
      await updateSetting("biometrics_enabled", "false");
    }
  }

  async function handleSaveName(name: string) {
    if (!userProfile) {
      throw new Error("Profile unavailable");
    }
    await updateUserProfile({ ...userProfile, name });
  }

  return (
    <SafeAreaView style={styles.container}>
      <EditNameModal
        visible={isEditModalVisible}
        currentName={userProfile?.name || ""}
        onSave={handleSaveName}
        onClose={() => setIsEditModalVisible(false)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPadding}
      >
        <Text style={styles.mainTitle}>More</Text>

        <View style={styles.card}>
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircleLarge}>
                <MaterialCommunityIcons
                  name="account"
                  size={48}
                  color={colors.accent}
                />
              </View>
              <TouchableOpacity
                style={styles.editBadgeLarge}
                onPress={() => setIsEditModalVisible(true)}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={14}
                  color={colors.onAccent}
                />
              </TouchableOpacity>
            </View>
            <View style={{ marginLeft: 20 }}>
              <Text style={styles.profileName}>{userProfile?.name ?? "—"}</Text>
              <Text style={styles.profileEmail}>
                {userProfile?.email ?? "—"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.card}>
          <SimpleLink
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push("/settings")}
            colors={colors}
            styles={styles}
          />
          <View style={styles.itemDivider} />
          <SimpleLink
            icon="shapes-outline"
            label="Category Settings"
            onPress={() => router.push("/category-settings")}
            colors={colors}
            styles={styles}
          />
          <View style={styles.itemDivider} />
          <SimpleLink
            icon="speedometer-outline"
            label="Budget Goals"
            onPress={() => router.push("/budget-goals")}
            colors={colors}
            styles={styles}
          />
        </View>

        <Text style={styles.sectionTitle}>PRIVACY & SECURITY</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.menuLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="finger-print" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.itemTitleText}>Security (Biometrics)</Text>
                <Text style={styles.itemSubText}>Use Face ID or Touch ID</Text>
              </View>
            </View>
            <Switch
              value={isBiometricsEnabled}
              onValueChange={handleBiometricsToggle}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.textPrimary}
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
                <Ionicons
                  name="cloud-outline"
                  size={20}
                  color={colors.accent}
                />
              </View>
              <View>
                <Text style={styles.itemTitleText}>Cloud Sync</Text>
                <Text style={styles.itemSubText}>
                  {syncUser ? syncUser.email : "Not connected"}
                </Text>
              </View>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              {syncUser && <View style={styles.syncDot} />}
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>RESOURCES</Text>
        <View style={styles.card}>
          <SimpleLink
            icon="help-circle-outline"
            label="Help & Support"
            disabled
            colors={colors}
            styles={styles}
          />
          <View style={styles.itemDivider} />
          <SimpleLink
            icon="chatbubble-ellipses-outline"
            label="Feedback"
            disabled
            colors={colors}
            styles={styles}
          />
          <View style={styles.itemDivider} />
          <SimpleLink
            icon="information-circle-outline"
            label="About"
            onPress={() => router.push("/about")}
            colors={colors}
            styles={styles}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

type StylesType = ReturnType<typeof createStyles>;

function SimpleLink({
  icon,
  label,
  onPress,
  disabled,
  colors,
  styles,
}: SimpleLinkProps & { colors: Colors; styles: StylesType }) {
  return (
    <TouchableOpacity
      style={styles.menuItemRow}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.iconBox, disabled && styles.iconBoxDisabled]}>
          <Ionicons
            name={icon}
            size={20}
            color={disabled ? colors.textDisabled : colors.accent}
          />
        </View>
        <Text
          style={[styles.itemTitleText, disabled && styles.itemTitleDisabled]}
        >
          {label}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={disabled ? colors.border : colors.textSecondary}
      />
    </TouchableOpacity>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollPadding: { paddingHorizontal: 20 },
    mainTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "700",
      marginTop: 10,
      marginBottom: 20,
    },
    sectionTitle: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1,
      marginTop: 25,
      marginBottom: 12,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      overflow: "hidden",
    },
    profileContent: { flexDirection: "row", alignItems: "center", padding: 20 },
    avatarContainer: { position: "relative" },
    avatarCircleLarge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.accentSubtle,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.accent,
    },
    editBadgeLarge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: colors.accent,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.surface,
    },
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
    itemTitleText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    itemSubText: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    profileName: { color: colors.textPrimary, fontSize: 20, fontWeight: "700" },
    profileEmail: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
    itemDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 16,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
    },
    syncDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.syncConnected,
    },
    iconBoxDisabled: { backgroundColor: colors.surfaceDisabled },
    itemTitleDisabled: { color: colors.textDisabled },
  });
}
