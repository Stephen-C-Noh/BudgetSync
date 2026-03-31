import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountsScreen() {
  const [activeTab, setActiveTab] = useState("Monthly");
  const [year, setYear] = useState(2025);

  const tabs = ["Daily", "Calendar", "Monthly", "Summary", "Description"];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/*Header*/}
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>Accounts</Text>
          <View style={styles.headerRight}>
            <Ionicons name="search-outline" size={22} color="#fff" style={{ marginRight: 18 }} />
            <Ionicons name="star-outline" size={22} color="#fff" style={{ marginRight: 18 }} />
            <Ionicons name="options-outline" size={22} color="#fff" />
          </View>
        </View>

        {/*Year*/}
        <View style={styles.yearContainer}>
          <TouchableOpacity onPress={() => setYear(year - 1)}>
            <Ionicons name="chevron-back" size={20} color="#A7B1C2" />
          </TouchableOpacity>
          <Text style={styles.year}>{year}</Text>
          <TouchableOpacity onPress={() => setYear(year + 1)}>
            <Ionicons name="chevron-forward" size={20} color="#A7B1C2" />
          </TouchableOpacity>
        </View>


        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/*Net Worth*/}
        <View style={styles.netWorthCard}>
          <Text style={styles.netWorthLabel}>Net Worth</Text>
          <Text style={styles.netWorthValue}>$42,850.32</Text>
          <View style={styles.tagsRow}>
            <View style={styles.tag}><Text style={styles.tagText}>5 Active Accounts</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Updated Today</Text></View>
          </View>
        </View>

        {/*Assets & Liabilities*/}
        <View style={styles.row}>
          <View style={styles.box}>
            <View style={styles.boxHeader}>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(42, 211, 0, 0.1)" }]}>
                <MaterialCommunityIcons name="bank" size={18} color="#2AD300" />
              </View>
              <Text style={styles.boxTitle}>Assets</Text>
            </View>
            <Text style={styles.boxValue}>$54,200.00</Text>
            <Text style={styles.greenText}>Total Value</Text>
          </View>

          <View style={styles.box}>
            <View style={styles.boxHeader}>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(255, 77, 77, 0.1)" }]}>
                <MaterialCommunityIcons name="credit-card-off" size={18} color="#FF4D4D" />
              </View>
              <Text style={styles.boxTitle}>Liabilities</Text>
            </View>
            <Text style={styles.boxValue}>$11,349.68</Text>
            <Text style={styles.redText}>Total Debt</Text>
          </View>
        </View>

        {/*Account breakdown*/}
        <Text style={styles.sectionTitle}>ACCOUNT BREAKDOWN</Text>

        {/* Cash & Bank */}
        <View style={styles.accountItem}>
          <View style={styles.accountLeft}>
            <View style={[styles.logoBox, { backgroundColor: "#1A2E44" }]}>
              <MaterialCommunityIcons name="wallet-outline" size={24} color="#5BA4FC" />
            </View>
            <View>
              <Text style={styles.accountName}>Cash & Bank</Text>
              <Text style={styles.accountSub}>Checking, Savings</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.accountValue}>$12,450.80</Text>
            <Text style={styles.accountTagGreenSmall}>Stable</Text>
          </View>
        </View>

        {/* Investments */}
        <View style={styles.accountItem}>
          <View style={styles.accountLeft}>
            <View style={[styles.logoBox, { backgroundColor: "#2A244D" }]}>
              <MaterialCommunityIcons name="trending-up" size={24} color="#A37CFF" />
            </View>
            <View>
              <Text style={styles.accountName}>Investments</Text>
              <Text style={styles.accountSub}>Stocks, Crypto, 401k</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.accountValue}>$38,749.20</Text>
            <Text style={styles.accountTagGreenSmall}>+4.2%</Text>
          </View>
        </View>

        {/* Credit Cards */}
        <View style={styles.accountItem}>
          <View style={styles.accountLeft}>
            <View style={[styles.logoBox, { backgroundColor: "#3D242B" }]}>
              <MaterialCommunityIcons name="credit-card" size={24} color="#FF7C7C" />
            </View>
            <View>
              <Text style={styles.accountName}>Credit Cards</Text>
              <Text style={styles.accountSub}>VISA, Amex, Mastercard</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.accountValue, { color: "#FF4D4D" }]}>-$3,150.25</Text>
            <Text style={styles.accountTagGray}>Due in 12d</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1519", paddingHorizontal: 20 },

  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  headerRight: { flexDirection: "row" },

  yearContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  year: { color: "#fff", fontSize: 18, fontWeight: "700", marginHorizontal: 30 },

  tabs: { marginBottom: 25 },
  tab: { marginRight: 25, alignItems: "center" },
  tabText: { color: "#7A869A", fontSize: 16, fontWeight: "500" },
  activeTabText: { color: "#fff" },
  activeIndicator: {
    marginTop: 8,
    height: 3,
    width: 28,
    backgroundColor: "#FF5A5F",
    borderRadius: 2,
  },

  netWorthCard: {
    backgroundColor: "#00D9FF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 25,
  },
  netWorthLabel: { color: "#0B1519", fontSize: 14, fontWeight: "500", opacity: 0.7 },
  netWorthValue: { color: "#0B1519", fontSize: 36, fontWeight: "800", marginVertical: 8 },
  tagsRow: { flexDirection: "row", marginTop: 10 },
  tag: {
    backgroundColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 10,
  },
  tagText: { color: "#0B1519", fontSize: 12, fontWeight: "600" },

  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  box: {
    flex: 0.48,
    backgroundColor: "#1C252E",
    padding: 16,
    borderRadius: 20,
  },
  boxHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 10 },
  boxTitle: { color: "#7A869A", fontSize: 14, fontWeight: "500" },
  boxValue: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  greenText: { color: "#2AD300", fontSize: 13 },
  redText: { color: "#FF4D4D", fontSize: 13 },

  sectionTitle: { color: "#fff", marginBottom: 15, fontSize: 13, fontWeight: "800", letterSpacing: 1 },

  accountItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1C252E",
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
  },
  accountLeft: { flexDirection: "row", alignItems: "center" },
  logoBox: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 14 },
  accountName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  accountSub: { color: "#7A869A", fontSize: 13, marginTop: 2 },
  accountValue: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 2 },
  accountTagGreenSmall: { color: "#2AD300", fontSize: 11 },
  accountTagGray: { color: "#7A869A", fontSize: 11 },
});