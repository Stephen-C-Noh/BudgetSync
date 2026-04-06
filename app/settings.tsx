import EditNameModal from "@/components/shared/EditNameModal";
import { useAppActions, useAppState } from "@/context/AppContext";
import { Colors, ThemeMode, useTheme } from "@/context/ThemeContext";
import { ensureNotificationPermission } from "@/lib/notifications";
import { updateSupabasePassword } from "@/lib/supabase";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
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
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type ExportMode = "month" | "range";

export default function SettingsScreen() {
  const router = useRouter();
  const {
    userProfile,
    isLoading,
    settings,
    accounts,
    categories,
    transactions,
  } = useAppState();
  const { updateSetting, updateUserProfile } = useAppActions();

  const { colors, colorScheme, themeMode, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isPassModalVisible, setIsPassModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const budgetAlerts =
    settings.find((s) => s.key === "budget_alerts")?.value === "1";
  const weeklyDigest =
    settings.find((s) => s.key === "weekly_digest")?.value === "1";

  // ─── CSV Export state ─────────────────────────────────────────────────────
  const now = new Date();

  // Confirmed export selection
  const [exportMode, setExportMode] = useState<ExportMode>("month");
  const [exportYear, setExportYear] = useState(now.getFullYear());
  const [exportMonth, setExportMonth] = useState(now.getMonth() + 1); // 1-12
  const [exportFromYear, setExportFromYear] = useState(now.getFullYear());
  const [exportFromMonth, setExportFromMonth] = useState(now.getMonth() + 1);
  const [exportToYear, setExportToYear] = useState(now.getFullYear());
  const [exportToMonth, setExportToMonth] = useState(now.getMonth() + 1);
  const [isExporting, setIsExporting] = useState(false);

  // ─── Month picker modal state ─────────────────────────────────────────────
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTab, setPickerTab] = useState<ExportMode>("month");
  // Year shown in the single-month grid
  const [pickerYear, setPickerYear] = useState(now.getFullYear());
  // Draft from/to while the range picker is open — applied only on "Apply"
  const [draftFromYear, setDraftFromYear] = useState(now.getFullYear());
  const [draftFromMonth, setDraftFromMonth] = useState(now.getMonth() + 1);
  const [draftToYear, setDraftToYear] = useState(now.getFullYear());
  const [draftToMonth, setDraftToMonth] = useState(now.getMonth() + 1);

  /** Opens the picker modal and seeds its internal state from the current confirmed selection. */
  function openPicker() {
    setPickerTab(exportMode);
    setPickerYear(exportYear);
    setDraftFromYear(exportFromYear);
    setDraftFromMonth(exportFromMonth);
    setDraftToYear(exportToYear);
    setDraftToMonth(exportToMonth);
    setPickerVisible(true);
  }

  /**
   * Confirms the range selection. Validates that "To" is not before "From"
   * before writing to export state and closing the modal.
   */
  function handleApplyRange() {
    const fromVal = draftFromYear * 12 + draftFromMonth;
    const toVal = draftToYear * 12 + draftToMonth;
    if (toVal < fromVal) {
      Alert.alert("Invalid Range", '"To" month cannot be before "From" month.');
      return;
    }
    setExportMode("range");
    setExportFromYear(draftFromYear);
    setExportFromMonth(draftFromMonth);
    setExportToYear(draftToYear);
    setExportToMonth(draftToMonth);
    setPickerVisible(false);
  }

  /**
   * Sanitises and escapes a single CSV field per RFC 4180.
   * Leading formula characters (=, +, -, @) are prefixed with a single quote
   * to prevent spreadsheet formula injection when the file is opened in
   * Excel or Google Sheets. Fields containing commas, quotes, carriage
   * returns, or newlines are wrapped in double-quotes, with any internal
   * double-quotes doubled.
   */
  function escapeCsvField(value: string): string {
    const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
    if (/[",\r\n]/.test(safeValue)) {
      return `"${safeValue.replace(/"/g, '""')}"`;
    }
    return safeValue;
  }

  /**
   * Filters transactions to the selected period and builds a CSV string.
   * Both modes are unified into a range comparison — single month is the
   * case where start and end prefixes are equal.
   * Category and account columns use human-readable names, not raw UUIDs.
   * Returns null when there are no transactions in the selected period.
   */
  function buildCsvExport(): string | null {
    const startPrefix =
      exportMode === "month"
        ? `${exportYear}-${String(exportMonth).padStart(2, "0")}`
        : `${exportFromYear}-${String(exportFromMonth).padStart(2, "0")}`;
    const endPrefix =
      exportMode === "month"
        ? `${exportYear}-${String(exportMonth).padStart(2, "0")}`
        : `${exportToYear}-${String(exportToMonth).padStart(2, "0")}`;
    const filtered = transactions.filter((t) => {
      const monthPrefix = t.date.substring(0, 7);
      return monthPrefix >= startPrefix && monthPrefix <= endPrefix;
    });
    if (filtered.length === 0) return null;

    // Precompute id-to-name maps for O(1) lookups per row instead of O(n*m)
    const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
    const accountNameById = new Map(accounts.map((a) => [a.id, a.name]));

    const header = "Date,Type,Amount,Category,Account,Note";
    const rows = filtered.map((t) => {
      const categoryName = categoryNameById.get(t.category_id) ?? t.category_id;
      const accountName = accountNameById.get(t.account_id) ?? t.account_id;
      return [
        escapeCsvField(t.date),
        escapeCsvField(t.type),
        t.amount.toFixed(2),
        escapeCsvField(categoryName),
        escapeCsvField(accountName),
        escapeCsvField(t.note ?? ""),
      ].join(",");
    });

    return [header, ...rows].join("\n");
  }

  /**
   * Generates the CSV for the selected period, writes it to a temporary cache
   * file, then triggers the OS share sheet so the user can save or forward it.
   */
  async function handleExport() {
    const csv = buildCsvExport();
    if (!csv) {
      const label =
        exportMode === "month"
          ? `${MONTH_NAMES[exportMonth - 1]} ${exportYear}`
          : `${MONTH_NAMES[exportFromMonth - 1]} ${exportFromYear} to ${MONTH_NAMES[exportToMonth - 1]} ${exportToYear}`;
      Alert.alert("No Data", `No transactions found for ${label}.`);
      return;
    }

    setIsExporting(true);
    try {
      const fileName =
        exportMode === "month"
          ? `budgetsync_${exportYear}_${String(exportMonth).padStart(2, "0")}.csv`
          : `budgetsync_${exportFromYear}${String(exportFromMonth).padStart(2, "0")}_${exportToYear}${String(exportToMonth).padStart(2, "0")}.csv`;
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

  async function handleSaveName(name: string) {
    if (!userProfile) {
      throw new Error("Profile unavailable");
    }
    await updateUserProfile({ ...userProfile, name });
  }

  // NEW PASSWORD LOGIC
  async function handleSavePassword() {
    if (!userProfile?.email) {
      Alert.alert("Security", "Connect sync first to change password.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setIsSaving(true);
    const errorMsg = await updateSupabasePassword(newPassword);
    setIsSaving(false);

    if (errorMsg) {
      Alert.alert("Update Failed", errorMsg);
    } else {
      Alert.alert("Success", "Password updated successfully.");
      setIsPassModalVisible(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <EditNameModal
        visible={isEditModalVisible}
        currentName={userProfile?.name || ""}
        onSave={handleSaveName}
        onClose={() => setIsEditModalVisible(false)}
      />

      {/* NEW PASSWORD MODAL (matches Name Modal style) */}
      <Modal visible={isPassModalVisible} transparent animationType="fade" onRequestClose={() => setIsPassModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Password</Text>

            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.textInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New Password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 15, top: 15 }}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setIsPassModalVisible(false)} style={[styles.modalBtn, { backgroundColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSavePassword} disabled={isSaving} style={[styles.modalBtn, { backgroundColor: colors.accent }]}>
                {isSaving ? <ActivityIndicator size="small" color={colors.onAccent} /> : <Text style={{ color: colors.onAccent, fontWeight: "700" }}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              <TouchableOpacity
                style={styles.editBadge}
                disabled={!userProfile}
                onPress={() => setIsEditModalVisible(true)}
              >
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
            {(["system", "light", "dark"] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeModeButton,
                  themeMode === mode && styles.themeModeButtonActive,
                ]}
                onPress={() => handleThemeModeChange(mode)}
              >
                <Text
                  style={[
                    styles.themeModeButtonText,
                    themeMode === mode && styles.themeModeButtonTextActive,
                  ]}
                >
                  {mode === "system"
                    ? "System"
                    : mode === "light"
                      ? "Light"
                      : "Dark"}
                </Text>
              </TouchableOpacity>
            ))}
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
          {/* Tappable row showing the current period selection */}
          <TouchableOpacity
            style={styles.monthPickerRow}
            onPress={openPicker}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.monthLabel}>
                {exportMode === "month"
                  ? `${MONTH_NAMES[exportMonth - 1]} ${exportYear}`
                  : `${MONTH_NAMES[exportFromMonth - 1]} ${exportFromYear} to ${MONTH_NAMES[exportToMonth - 1]} ${exportToYear}`}
              </Text>
              <Text style={styles.monthSubLabel}>Tap to change period</Text>
            </View>
            <Ionicons name="calendar-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.actionBtn} onPress={() => setIsPassModalVisible(true)}>
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

      {/* ─── Period Picker Modal ─── */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerSheet}>
            {/* Header */}
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Period</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Month / Range tab toggle */}
            <View style={styles.pickerToggle}>
              {(["month", "range"] as ExportMode[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.pickerTabBtn,
                    pickerTab === tab && styles.pickerTabActive,
                  ]}
                  onPress={() => setPickerTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.pickerTabText,
                      pickerTab === tab && styles.pickerTabTextActive,
                    ]}
                  >
                    {tab === "month" ? "Month" : "Range"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {pickerTab === "month" ? (
                <>
                  {/* Year navigation */}
                  <View style={styles.yearRow}>
                    <TouchableOpacity
                      style={styles.yearArrow}
                      onPress={() => setPickerYear((y) => y - 1)}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={20}
                        color={colors.accent}
                      />
                    </TouchableOpacity>
                    <Text style={styles.yearLabel}>{pickerYear}</Text>
                    <TouchableOpacity
                      style={styles.yearArrow}
                      onPress={() => setPickerYear((y) => y + 1)}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.accent}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Month grid — tap to confirm and close */}
                  <View style={styles.monthGrid}>
                    {MONTH_NAMES.map((name, i) => {
                      const month = i + 1;
                      const isSelected =
                        exportMode === "month" &&
                        exportYear === pickerYear &&
                        exportMonth === month;
                      return (
                        <TouchableOpacity
                          key={name}
                          style={[
                            styles.monthCell,
                            isSelected && styles.monthCellActive,
                          ]}
                          onPress={() => {
                            setExportMode("month");
                            setExportYear(pickerYear);
                            setExportMonth(month);
                            setPickerVisible(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.monthCellText,
                              isSelected && styles.monthCellTextActive,
                            ]}
                          >
                            {name.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : (
                <>
                  {/* From picker */}
                  <Text style={styles.rangeLabel}>FROM</Text>
                  <View style={styles.yearRow}>
                    <TouchableOpacity
                      style={styles.yearArrow}
                      onPress={() => setDraftFromYear((y) => y - 1)}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={20}
                        color={colors.accent}
                      />
                    </TouchableOpacity>
                    <Text style={styles.yearLabel}>{draftFromYear}</Text>
                    <TouchableOpacity
                      style={styles.yearArrow}
                      onPress={() => setDraftFromYear((y) => y + 1)}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.accent}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.monthGrid}>
                    {MONTH_NAMES.map((name, i) => {
                      const month = i + 1;
                      const isSelected = draftFromMonth === month;
                      return (
                        <TouchableOpacity
                          key={name}
                          style={[
                            styles.monthCell,
                            isSelected && styles.monthCellActive,
                          ]}
                          onPress={() => setDraftFromMonth(month)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.monthCellText,
                              isSelected && styles.monthCellTextActive,
                            ]}
                          >
                            {name.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* To picker */}
                  <Text style={[styles.rangeLabel, { marginTop: 8 }]}>TO</Text>
                  <View style={styles.yearRow}>
                    <TouchableOpacity
                      style={styles.yearArrow}
                      onPress={() => setDraftToYear((y) => y - 1)}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={20}
                        color={colors.accent}
                      />
                    </TouchableOpacity>
                    <Text style={styles.yearLabel}>{draftToYear}</Text>
                    <TouchableOpacity
                      style={styles.yearArrow}
                      onPress={() => setDraftToYear((y) => y + 1)}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.accent}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.monthGrid}>
                    {MONTH_NAMES.map((name, i) => {
                      const month = i + 1;
                      const isSelected = draftToMonth === month;
                      return (
                        <TouchableOpacity
                          key={name}
                          style={[
                            styles.monthCell,
                            isSelected && styles.monthCellActive,
                          ]}
                          onPress={() => setDraftToMonth(month)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.monthCellText,
                              isSelected && styles.monthCellTextActive,
                            ]}
                          >
                            {name.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Apply button */}
                  <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={handleApplyRange}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.applyBtnText}>Apply Range</Text>
                  </TouchableOpacity>
                  <View style={{ height: 8 }} />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    themeModeRow: { flexDirection: "row", gap: 10, padding: 16 },
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
    monthLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    monthSubLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    // ─── Picker modal ───────────────────────────────────────────────────────
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: colors.overlay,
    },
    pickerSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 12,
      maxHeight: "85%",
    },
    pickerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    pickerTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "700",
    },
    pickerToggle: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 4,
      marginBottom: 20,
    },
    pickerTabBtn: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 10,
      alignItems: "center",
    },
    pickerTabActive: { backgroundColor: colors.accent },
    pickerTabText: {
      color: colors.textSecondary,
      fontWeight: "600",
      fontSize: 14,
    },
    pickerTabTextActive: { color: colors.onAccent, fontWeight: "700" },
    yearRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    yearArrow: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.accentBg,
      justifyContent: "center",
      alignItems: "center",
    },
    yearLabel: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "700",
    },
    monthGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    },
    monthCell: {
      width: "22%",
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      alignItems: "center",
    },
    monthCellActive: {
      backgroundColor: colors.accent,
    },
    monthCellText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
    monthCellTextActive: {
      color: colors.onAccent,
      fontWeight: "700",
    },
    rangeLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 12,
    },
    applyBtn: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
    },
    applyBtnText: {
      color: colors.onAccent,
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
