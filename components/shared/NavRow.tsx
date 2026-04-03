import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  label: string;
  onPrev: () => void;
  onNext: () => void;
};

export default function NavRow({ label, onPrev, onNext }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.navRow}>
      <TouchableOpacity onPress={onPrev}>
        <Ionicons name="chevron-back" size={20} color={colors.tabBarInactive} />
      </TouchableOpacity>
      <Text style={[styles.navLabel, { color: colors.textPrimary }]}>{label}</Text>
      <TouchableOpacity onPress={onNext}>
        <Ionicons name="chevron-forward" size={20} color={colors.tabBarInactive} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  navLabel: { fontSize: 17, fontWeight: "700", marginHorizontal: 24 },
});
