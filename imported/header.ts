import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Header() {
  const [activeTab, setActiveTab] = useState("Monthly");
  const [year, setYear] = useState(2025);

  const tabs = ["Daily", "Calendar", "Monthly", "Summary", "Description"];

  // Handlers for year navigation
  const prevYear = () => setYear((prev) => prev - 1);
  const nextYear = () => setYear((prev) => prev + 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Top row: search icon + title + right icons */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity>
            <Ionicons name="search-outline" size={22} color="#000" />
          </TouchableOpacity>

          <Text style={styles.title}>Trans.</Text>

          <View style={styles.headerRight}>
            <TouchableOpacity style={{ marginRight: 14 }}>
              <Ionicons name="star-outline" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="options-outline" size={22} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Year row */}
        <View style={styles.yearContainer}>
          <TouchableOpacity onPress={prevYear}>
            <Text style={styles.arrow}>{"<"}</Text>
          </TouchableOpacity>

          <Text style={styles.year}>{year}</Text>

          <TouchableOpacity onPress={nextYear}>
            <Text style={styles.arrow}>{">"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, styles.income]}>0.00</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Exp.</Text>
          <Text style={[styles.summaryValue, styles.expense]}>0.00</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>0.00</Text>
        </View>
      </View>
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: { backgroundColor: "#fff" },

  /* Header */
  header: { paddingTop: 50, paddingHorizontal: 16, backgroundColor: "#fff" },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerRight: { flexDirection: "row", alignItems: "center" },

  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginLeft: 40,
  },

  // Year row
  yearContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  arrow: {
    fontSize: 18,
    color: "#000",
    fontWeight: "700",
  },
  year: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },

  /* Tabs */
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingTop: 12,
  },
  tab: { alignItems: "center", paddingBottom: 10 },
  tabText: { fontSize: 14, color: "#aaa" },
  activeTabText: { color: "#000", fontWeight: "600" },
  activeIndicator: {
    marginTop: 6,
    height: 3,
    width: 28,
    backgroundColor: "#ff6b5a",
    borderRadius: 2,
  },

  /* Summary */
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryLabel: { fontSize: 13, color: "#777", marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "600", color: "#000" },
  income: { color: "#2f80ed" },
  expense: { color: "#eb5757" },
});