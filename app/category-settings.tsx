import EmptyState from "@/components/shared/EmptyState"; // IMPORTED
import { useAppActions, useAppState } from "@/context/AppContext";
import { Colors, useTheme } from "@/context/ThemeContext";
import { Category } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CategorySettingsScreen() {
  const router = useRouter();
  const { categories, isLoading } = useAppState();
  const { addCategory, updateCategory, deleteCategory } = useAppActions();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [iconInput, setIconInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const displayCategories = useMemo(
    () => categories.filter((c) => c.type === activeTab),
    [categories, activeTab],
  );

  function openAddModal() {
    setEditingCat(null);
    setNameInput("");
    setIconInput("");
    setModalVisible(true);
  }

  function openEditModal(cat: Category) {
    setEditingCat(cat);
    setNameInput(cat.name);
    setIconInput(cat.icon ?? "");
    setModalVisible(true);
  }

  async function handleSave() {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      Alert.alert("Missing Name", "Please enter a category name.");
      return;
    }
    setIsSaving(true);
    try {
      if (editingCat) {
        await updateCategory({
          ...editingCat,
          name: trimmedName,
          icon: iconInput.trim() || undefined,
        });
      } else {
        await addCategory({
          id: Crypto.randomUUID(),
          name: trimmedName,
          icon: iconInput.trim() || undefined,
          type: activeTab,
          is_custom: 1,
        });
      }
      setModalVisible(false);
    } catch {
      Alert.alert("Save Failed", "We couldn't save this category. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete(cat: Category) {
    if (cat.is_custom !== 1) return;
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(cat.id);
            } catch {
              Alert.alert("Delete Failed", "We couldn't delete this category. Please try again.");
            }
          },
        },
      ],
    );
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginLeft: 15, paddingRight: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Category Settings</Text>
        <View style={{ width: 24, marginRight: 15 }} />
      </View>

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
            <EmptyState
              icon="shape-outline"
              title="No Categories"
              description={`You don't have any custom ${activeTab} categories yet.`}
              buttonLabel="Add Category"
              onPress={openAddModal}
            />
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
                  {cat.is_custom === 1 && (
                    <View style={styles.categoryActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => openEditModal(cat)}
                      >
                        <Ionicons name="pencil-outline" size={18} color={colors.accent} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { marginLeft: 8 }]}
                        onPress={() => handleDelete(cat)}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                {index < displayCategories.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={20} color={colors.onAccent} style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Add Custom Category</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCat ? "Edit Category" : "Add Category"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {editingCat && (
                <>
                  <Text style={styles.fieldLabel}>TYPE</Text>
                  <View style={styles.readOnlyField}>
                    <Text style={styles.readOnlyText}>{editingCat.type.charAt(0).toUpperCase() + editingCat.type.slice(1)}</Text>
                    <Ionicons name="lock-closed-outline" size={14} color={colors.textDisabled} />
                  </View>
                </>
              )}
              <Text style={styles.fieldLabel}>CATEGORY NAME</Text>
              <TextInput style={styles.textInput} placeholder="e.g. Coffee" placeholderTextColor={colors.textDisabled} value={nameInput} onChangeText={setNameInput} />
              <Text style={styles.fieldLabel}>ICON (EMOJI)</Text>
              <TextInput style={styles.textInput} placeholder="e.g. ☕" placeholderTextColor={colors.textDisabled} value={iconInput} onChangeText={setIconInput} />
              <TouchableOpacity style={[styles.saveButton, isSaving && { opacity: 0.6 }]} onPress={handleSave} disabled={isSaving} activeOpacity={0.85}>
                <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : editingCat ? "Update Category →" : "Save Category →"}</Text>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15 },
    headerTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "700" },
    toggle: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: 14, padding: 4, marginHorizontal: 20, marginBottom: 20 },
    toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
    toggleActive: { backgroundColor: colors.accent },
    toggleText: { color: colors.textSecondary, fontWeight: "600", fontSize: 15 },
    toggleTextActive: { color: colors.onAccent, fontWeight: "700" },
    scroll: { paddingHorizontal: 20 },
    card: { backgroundColor: colors.surface, borderRadius: 20, overflow: "hidden", marginBottom: 16 },
    categoryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
    categoryLeft: { flexDirection: "row", alignItems: "center" },
    iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", marginRight: 14 },
    catEmoji: { fontSize: 20 },
    categoryName: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
    categoryActions: { flexDirection: "row" },
    actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
    addBtn: { backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 16, flexDirection: "row", justifyContent: "center", alignItems: "center" },
    addBtnText: { color: colors.onAccent, fontSize: 16, fontWeight: "700" },
    modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay },
    modalSheet: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 20, maxHeight: "80%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    modalTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "700" },
    fieldLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 10 },
    textInput: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, color: colors.textPrimary, fontSize: 15, marginBottom: 24 },
    readOnlyField: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surfaceDisabled, borderRadius: 14, padding: 16, marginBottom: 24 },
    readOnlyText: { color: colors.textDisabled, fontSize: 15 },
    saveButton: { backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 17, alignItems: "center", marginTop: 8 },
    saveButtonText: { color: colors.onAccent, fontSize: 16, fontWeight: "700" },
  });
}