import { Colors, useTheme } from "@/context/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EmptyStateProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  buttonLabel?: string;
  onPress?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  buttonLabel,
  onPress,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={42} color={colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {buttonLabel && onPress && (
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={20} color={colors.onAccent} style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      paddingVertical: 40,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.accentSubtle,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 8,
    },
    description: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
    button: {
      flexDirection: "row",
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    buttonText: {
      color: colors.onAccent,
      fontWeight: "700",
      fontSize: 15,
    },
  });