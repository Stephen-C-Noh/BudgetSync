import { useAppActions, useAppState } from "@/context/AppContext";
import { Colors, ThemeMode, useTheme } from "@/context/ThemeContext";
import { ensureNotificationPermission } from "@/lib/notifications";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useMemo, useState } from "react";
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function SettingsScreen() {
  const router = useRouter();
  const { userProfile, isLoading, settings, accounts, categories, transactions } = useAppState();
  const { updateSetting } = useAppActions();
  const { colors, colorScheme, themeMode, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const budgetAlerts =
    settings.find((s) => s.key === "budget_alerts")?.value === "1";
  const weeklyDigest =
    settings.find((s) => s.key === "weekly_digest")?.value === "1";

  // ─── CSV Export state ─────────────────────────────────────────────────────
  const now = new Date();
  const [exportYear, setExportYear] = useState(now.getFullYear());
  const [exportMonth, setExportMonth] = useState(now.getMonth() + 1); // 1-12
  const [isExporting, setIsExporting] = useState(false);

  function prevMonth() {
    if (exportMonth === 1) {
      setExportMonth(12);
      setExportYear((y) => y - 1);
    } else {
      setExportMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (exportMonth === 12) {
      setExportMonth(1);
      setExportYear((y) => y + 1);
    } else {
      setExportMonth((m) => m + 1);
    }
  }

  /**
   * Wraps a CSV field in double-quotes if it contains commas, quotes, or
   * newlines. Internal double-quotes are escaped by doubling them (RFC 4180).
   */
  function escapeCsvField(value: string): string {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Filters transactions to the selected month/year and builds a CSV string.
   * Category and account columns use human-readable names, not raw UUIDs.
   * Returns null when there are no transactions in the selected period.
   */
  function buildCsvExport(): string | null {
    const prefix = `${exportYear}-${String(exportMonth).padStart(2, "0")}`;
    const filtered = transactions.filter((t) => t.date.startsWith(prefix));
    if (filtered.length === 0) return null;

    const header = "Date,Type,Amount,Category,Account,Note";
    const rows = filtered.map((t) => {
      const categoryName =
        categories.find((c) => c.id === t.category_id)?.name ?? t.category_id;
      const accountName =
        accounts.find((a) => a.id === t.account_id)?.name ?? t.account_id;
      return [
        escapeCsvField(t.date),
        escapeCsvField(t.type),
        String(t.amount),
        escapeCsvField(categoryName),
        escapeCsvField(accountName),
        escapeCsvField(t.note ?? ""),
      ].join(",");
    });

    return [header, ...rows].join("\n");
  }

  /**
   * Generates the CSV for the selected month, writes it to a temporary cache
   * file, then triggers the OS share sheet so the user can save or forward it.
   */
  async function handleExport() {
    const csv = buildCsvExport();
    if (!csv) {
      Alert.alert(
        "No Data",
        `No transactions found for ${MONTH_NAMES[exportMonth - 1]} ${exportYear}.`,
      );
      return;
    }

    setIsExporting(true);
    try {
      const fileName = `budgetsync_${exportYear}_${String(exportMonth).padStart(2, "0")}.csv`;
      const file = new File(Paths.cache, fileName);
      file.create({ overwrite: true });
      file.write(csv);
      await Sharing.shareAsync(file.uri, {
        mimeType: "text/csv",
        dialogTitle: "Export Transactions",
        UTI: "public.comma-separated-values-text",
      });
    } catch {
      Alert.alert(
        "Export Failed",
        "We couldn't export your transactions. Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  }

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

  async function handleThemeModeChange(mode: ThemeMode) {
    if (mode === themeMode) return;
    await setThemeMode(mode);
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

        <Text style={styles.sectionTitle}>APPEARANCE</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.itemTitleText}>Theme</Text>
              <Text style={styles.itemSubText}>
                {themeMode === "system"
                  ? `Following system (${colorScheme === "dark" ? "Dark" : "Light"})`
                  : colorScheme === "dark"
                    ? "Dark"
                    : "Light"}
              </Text>
            </View>
          </View>
          <View style={styles.itemDivider} />
          <View style={styles.themeModeRow}>
            {(["system", "light", "dark"] as ThemeMode[]).map((mode) => {
              const isActive = themeMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeModeButton,
                    isActive && styles.themeModeButtonActive,
                  ]}
                  onPress={() => handleThemeModeChange(mode)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.themeModeButtonText,
                      isActive && styles.themeModeButtonTextActive,
                    ]}
                  >
                    {mode === "system"
                      ? "System"
                      : mode === "light"
                        ? "Light"
                        : "Dark"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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

        <Text style={styles.sectionTitle}>DATA EXPORT</Text>
        <View style={styles.card}>
          {/* Month selector: tap the arrows to navigate to the desired month */}
          <View style={styles.monthPickerRow}>
            <TouchableOpacity style={styles.monthArrow} onPress={prevMonth}>
              <Ionicons name="chevron-back" size={20} color={colors.accent} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[exportMonth - 1]} {exportYear}
            </Text>
            <TouchableOpacity style={styles.monthArrow} onPress={nextMonth}>
              <Ionicons name="chevron-forward" size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>
          <View style={styles.itemDivider} />
          <TouchableOpacity
            style={[styles.exportBtn, isExporting && { opacity: 0.6 }]}
            onPress={handleExport}
            disabled={isExporting}
            activeOpacity={0.85}
          >
            <Ionicons
              name="download-outline"
              size={18}
              color={colors.onAccent}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.exportBtnText}>
              {isExporting ? "Exporting..." : "Export CSV"}
            </Text>
          </TouchableOpacity>
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      overflow: "hidden",
    },
    identityContent: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
    },
    avatarContainer: { position: "relative" },
    avatarCircle: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: colors.accentSubtle,
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
    itemTitleText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    itemSubText: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
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
    themeModeRow: {
      flexDirection: "row",
      gap: 10,
      padding: 16,
    },
    themeModeButton: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
    },
    themeModeButtonActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentBg,
    },
    themeModeButtonText: {
      color: colors.textSecondary,
      fontWeight: "600",
      fontSize: 14,
    },
    themeModeButtonTextActive: {
      color: colors.accent,
    },
    monthPickerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
    },
    monthArrow: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.accentBg,
      justifyContent: "center",
      alignItems: "center",
    },
    monthLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    exportBtn: {
      flexDirection: "row",
      backgroundColor: colors.accent,
      margin: 16,
      borderRadius: 14,
      paddingVertical: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    exportBtnText: {
      color: colors.onAccent,
      fontSize: 15,
      fontWeight: "700",
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
      backgroundColor: colors.dangerSubtle,
      borderColor: colors.dangerBorder,
      marginTop: 15,
    },
    actionBtnText: {
      color: colors.textPrimary,
      fontWeight: "700",
      fontSize: 15,
    },
  });
}
