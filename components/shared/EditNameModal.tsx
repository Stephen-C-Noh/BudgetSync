import { Colors, useTheme } from "@/context/ThemeContext";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface EditNameModalProps {
  visible: boolean;
  currentName: string;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}

export default function EditNameModal({ visible, currentName, onSave, onClose }: EditNameModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [newName, setNewName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) setNewName(currentName);
  }, [visible]);

  async function handleSave() {
    const trimmed = newName.trim();
    if (!trimmed) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(trimmed);
      onClose();
    } catch {
      Alert.alert("Error", "Failed to update name");
    } finally {
      setIsSaving(false);
    }
  }

  function handleClose() {
    if (!isSaving) onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Full Name</Text>
          <TextInput
            style={styles.textInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter full name"
            placeholderTextColor={colors.textSecondary}
            maxLength={50}
            autoFocus
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isSaving}
              style={[styles.modalBtn, { backgroundColor: colors.border }]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[styles.modalBtn, { backgroundColor: colors.accent }]}
            >
              {isSaving
                ? <ActivityIndicator size="small" color={colors.onAccent} />
                : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center", padding: 20 },
    modalContent: { width: "100%", backgroundColor: colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border },
    modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 20, textAlign: "center" },
    textInput: { backgroundColor: colors.background, color: colors.textPrimary, padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
    modalButtons: { flexDirection: "row", gap: 12 },
    modalBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center" },
    cancelText: { color: colors.textPrimary },
    saveText: { color: colors.onAccent, fontWeight: "700" },
  });
}
