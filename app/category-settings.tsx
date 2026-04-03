import { Ionicons } from "@expo/vector-icons";
import { useAppActions, useAppState } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CategorySettingsScreen() {
  const router = useRouter();
  const { categories, isLoading } = useAppState();
  const { deleteCategory } = useAppActions();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const styles = useMemo(() => createStyles(colors), [colors]);

  const displayCategories = useMemo(
    () => categories.filter((c) => c.type === activeTab),
    [categories, activeTab]
  );

  function handleDelete(id: string) {
    Alert.alert("Delete Category", "Are you sure you want to delete this category?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteCategory(id),
      },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15, paddingRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Category Settings</Text>
        <View style={{ width: 24, marginRight: 15 }} />
      </View>

      {/* Expense / Income toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === "expense" && styles.toggleActive]}
          onPress={() => setActiveTab("expense")}
        >
          <Text style={[styles.toggleText, activeTab === "expense" && styles.toggleTextActive]}>
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === "income" && styles.toggleActive]}
          onPress={() => setActiveTab("income")}
        >
          <Text style={[styles.toggleText, activeTab === "income" && styles.toggleTextActive]}>
            Income
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          {displayCategories.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No categories yet.</Text>
            </View>
          ) : (
            displayCategories.map((cat, index) => (
              <View key={cat.id}>
                <View style={styles.categoryRow}>
                  <View style={styles.categoryLeft}>
                    <View style={styles.iconBox}>
                      <Text style={styles.catEmoji}>{cat.icon ?? "📦"}</Text>
                    </View>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                  </View>
                  <View style={styles.categoryActions}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Ionicons name="pencil-outline" size={18} color={colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { marginLeft: 8 }]}
                      onPress={() => handleDelete(cat.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                {index < displayCategories.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add-circle-outline" size={20} color={colors.onAccent} style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Add Custom Category</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
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

    toggle: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 4,
      marginHorizontal: 20,
      marginBottom: 20,
    },
    toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
    toggleActive: { backgroundColor: colors.accent },
    toggleText: { color: colors.textSecondary, fontWeight: "600", fontSize: 15 },
    toggleTextActive: { color: colors.onAccent, fontWeight: "700" },

    scroll: { paddingHorizontal: 20 },
    card: { backgroundColor: colors.surface, borderRadius: 20, overflow: "hidden", marginBottom: 16 },

    emptyRow: { padding: 20, alignItems: "center" },
    emptyText: { color: colors.textSecondary, fontSize: 14 },

    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
    },
    categoryLeft: { flexDirection: "row", alignItems: "center" },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    catEmoji: { fontSize: 20 },
    categoryName: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
    categoryActions: { flexDirection: "row" },
    actionBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
    },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },

    addBtn: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    addBtnText: { color: colors.onAccent, fontSize: 16, fontWeight: "700" },
  });
}
