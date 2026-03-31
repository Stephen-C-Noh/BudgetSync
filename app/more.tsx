import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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

interface SimpleLinkProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}

export default function MoreScreen() {
  const [activePage, setActivePage] = useState("MoreMain");
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // ---Settings Screen---
  if (activePage === "Settings") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => setActivePage("MoreMain")}
            style={{ marginLeft: 15, paddingRight: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#00D9FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24, marginRight: 15 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          <Text style={styles.sectionTitle}>IDENTITY</Text>
          <View style={styles.card}>
            <View style={styles.identityContent}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  <MaterialCommunityIcons name="account" size={40} color="#00D9FF" />
                </View>
                <TouchableOpacity style={styles.editBadgeSmall}>
                  <MaterialCommunityIcons name="pencil" size={12} color="#0B1519" />
                </TouchableOpacity>
              </View>
              <View style={styles.identityText}>
                <Text style={styles.blueLabel}>FULL NAME</Text>
                <Text style={styles.whiteValue}>Alex Johnson</Text>
                <View style={styles.lineDivider} />
                <Text style={[styles.blueLabel, { marginTop: 12 }]}>EMAIL ACCESS</Text>
                <Text style={styles.whiteValue}>alex.johnson@budgetsync.io</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>LOCALIZATION</Text>
          <View style={styles.card}>
            <MenuRow icon="cash-outline" title="Primary Currency" subTitle="USD ($)" />
            <View style={styles.itemDivider} />
            <MenuRow icon="globe-outline" title="System Language" subTitle="EN-US" />
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
                onValueChange={setBudgetAlerts}
                trackColor={{ false: "#2A333D", true: "#00D9FF" }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.itemDivider} />
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.itemTitleText}>Weekly Sync Digest</Text>
                <Text style={styles.itemSubText}>Aggregated performance summary</Text>
              </View>
              <Switch
                value={weeklyDigest}
                onValueChange={setWeeklyDigest}
                trackColor={{ false: "#2A333D", true: "#00D9FF" }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>SECURITY</Text>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="refresh" size={20} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.actionBtnText}>Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]}>
            <MaterialCommunityIcons name="delete-outline" size={20} color="#FF4D4D" style={{ marginRight: 10 }} />
            <Text style={[styles.actionBtnText, { color: "#FF4D4D" }]}>Delete Account</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---More screen---
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
              <Text style={styles.profileName}>Alex Johnson</Text>
              <Text style={styles.profileEmail}>alex.johnson@budgetsync.io</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.card}>
          <SimpleLink
            icon="settings-outline"
            label="Settings"
            onPress={() => setActivePage("Settings")}
          />
          <View style={styles.itemDivider} />
          <SimpleLink icon="shapes-outline" label="Category Settings" />
          <View style={styles.itemDivider} />
          <SimpleLink icon="speedometer-outline" label="Budget Goals" />
        </View>

        <Text style={styles.sectionTitle}>PRIVACY & SECURITY</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.menuLeft}>
              <View style={styles.iconBox}><Ionicons name="finger-print" size={20} color="#00D9FF" /></View>
              <View>
                <Text style={styles.itemTitleText}>Security (Biometrics)</Text>
                <Text style={styles.itemSubText}>Use Face ID or Touch ID</Text>
              </View>
            </View>
            <Switch
              value={isBiometricsEnabled}
              onValueChange={setIsBiometricsEnabled}
              trackColor={{ false: "#2A333D", true: "#00D9FF" }}
              thumbColor="#FFF"
            />
          </View>
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

function MenuRow({ icon, title, subTitle }: MenuRowProps) {
  return (
    <TouchableOpacity style={styles.menuItemRow}>
      <View style={styles.menuLeft}>
        <View style={styles.iconBox}><Ionicons name={icon} size={20} color="#00D9FF" /></View>
        <View>
          <Text style={styles.itemTitleText}>{title}</Text>
          {subTitle && <Text style={styles.itemSubText}>{subTitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#7A869A" />
    </TouchableOpacity>
  );
}

function SimpleLink({ icon, label, onPress }: SimpleLinkProps) {
  return (
    <TouchableOpacity style={styles.menuItemRow} onPress={onPress}>
      <View style={styles.menuLeft}>
        <View style={styles.iconBox}><Ionicons name={icon} size={20} color="#00D9FF" /></View>
        <Text style={styles.itemTitleText}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#7A869A" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1519" },
  scrollPadding: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15 },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  mainTitle: { color: "#FFF", fontSize: 24, fontWeight: "700", marginTop: 10, marginBottom: 20 },
  sectionTitle: { color: "#7A869A", fontSize: 12, fontWeight: "800", letterSpacing: 1, marginTop: 25, marginBottom: 12 },
  card: { backgroundColor: "#1C252E", borderRadius: 20, overflow: "hidden" },
  profileContent: { flexDirection: "row", alignItems: "center", padding: 20 },
  identityContent: { flexDirection: "row", alignItems: "center", padding: 20 },
  avatarContainer: { position: "relative" },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(0, 217, 255, 0.05)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#00D9FF" },
  avatarCircleLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(0, 217, 255, 0.05)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#00D9FF" },
  editBadgeSmall: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#00D9FF", width: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#1C252E" },
  editBadgeLarge: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#00D9FF", width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#1C252E" },
  identityText: { flex: 1, marginLeft: 20 },
  blueLabel: { color: "#00D9FF", fontSize: 10, fontWeight: "800", marginBottom: 4 },
  whiteValue: { color: "#FFF", fontSize: 16, fontWeight: "500" },
  lineDivider: { height: 1, backgroundColor: "#2A333D", marginTop: 8 },
  menuItemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0, 217, 255, 0.1)", justifyContent: "center", alignItems: "center", marginRight: 15 },
  itemTitleText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  itemSubText: { color: "#7A869A", fontSize: 12, marginTop: 2 },
  profileName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  profileEmail: { color: "#7A869A", fontSize: 14, marginTop: 4 },
  itemDivider: { height: 1, backgroundColor: "#2A333D", marginHorizontal: 16 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  actionBtn: { flexDirection: "row", backgroundColor: "#1C252E", padding: 18, borderRadius: 20, alignItems: "center", justifyContent: "center", marginTop: 10, borderWidth: 1, borderColor: "#2A333D" },
  deleteBtn: { backgroundColor: "rgba(255, 77, 77, 0.05)", borderColor: "rgba(255, 77, 77, 0.2)", marginTop: 15 },
  actionBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});