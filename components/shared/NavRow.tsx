import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  label: string;
  onPrev: () => void;
  onNext: () => void;
};

export default function NavRow({ label, onPrev, onNext }: Props) {
  return (
    <View style={styles.navRow}>
      <TouchableOpacity onPress={onPrev}>
        <Ionicons name="chevron-back" size={20} color="#A7B1C2" />
      </TouchableOpacity>
      <Text style={styles.navLabel}>{label}</Text>
      <TouchableOpacity onPress={onNext}>
        <Ionicons name="chevron-forward" size={20} color="#A7B1C2" />
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
  navLabel: { color: "#fff", fontSize: 17, fontWeight: "700", marginHorizontal: 24 },
});
