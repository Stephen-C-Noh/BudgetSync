import AccountsMonthlyView from "@/components/accounts/MonthlyView";
import AccountsSummaryView from "@/components/accounts/SummaryView";
import { useAppState } from "@/context/AppContext";
import { Colors, useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function AccountsScreen() {
 const { colors } = useTheme();
 const { accounts, transactions, categories } = useAppState();
 const styles = useMemo(() => createStyles(colors), [colors]);
 const [viewMode, setViewMode] = useState<"summary" | "monthly">("summary");
 const [showStarred, setShowStarred] = useState(false);
 const visibleTransactions = useMemo(() => {
   if (!showStarred) return transactions;
   return transactions.filter((tx) => tx.starred === 1);
 }, [transactions, showStarred]);
 return (
<SafeAreaView style={styles.container}>
<View style={styles.header}>
<View style={styles.headerTop}>
<Text style={styles.title}>Accounts</Text>
<TouchableOpacity
           onPress={() => setShowStarred((prev) => !prev)}
           style={styles.iconButton}
           activeOpacity={0.7}
>
<Ionicons
             name={showStarred ? "star" : "star-outline"}
             size={22}
             color={showStarred ? colors.accent : colors.textPrimary}
           />
</TouchableOpacity>
</View>
       {showStarred && (
<Text style={styles.filterLabel}>Showing starred transactions</Text>
       )}
<View style={styles.toggle}>
<TouchableOpacity
           style={[
             styles.toggleBtn,
             viewMode === "summary" && styles.toggleActive,
           ]}
           onPress={() => setViewMode("summary")}
>
<Text
             style={[
               styles.toggleText,
               viewMode === "summary" && styles.toggleTextActive,
             ]}
>
             Summary
</Text>
</TouchableOpacity>
<TouchableOpacity
           style={[
             styles.toggleBtn,
             viewMode === "monthly" && styles.toggleActive,
           ]}
           onPress={() => setViewMode("monthly")}
>
<Text
             style={[
               styles.toggleText,
               viewMode === "monthly" && styles.toggleTextActive,
             ]}
>
             Monthly
</Text>
</TouchableOpacity>
</View>
</View>
<ScrollView
       showsVerticalScrollIndicator={false}
       contentContainerStyle={styles.scroll}
>
       {viewMode === "summary" ? (
<AccountsSummaryView
           accounts={accounts}
           transactions={visibleTransactions}
           categories={categories}
         />
       ) : (
<AccountsMonthlyView accounts={accounts} />
       )}
</ScrollView>
</SafeAreaView>
 );
}
function createStyles(colors: Colors) {
 return StyleSheet.create({
   container: { flex: 1, backgroundColor: colors.background },
   header: {
     paddingHorizontal: 20,
     paddingVertical: 16,
     borderBottomWidth: 1,
     borderBottomColor: colors.border,
   },
   headerTop: {
     flexDirection: "row",
     alignItems: "center",
     justifyContent: "space-between",
     marginBottom: 16,
   },
   title: {
     color: colors.textPrimary,
     fontSize: 24,
     fontWeight: "700",
   },
   iconButton: {
     alignItems: "center",
     justifyContent: "center",
     padding: 4,
   },
   filterLabel: {
     color: colors.accent,
     fontSize: 12,
     fontWeight: "600",
     marginBottom: 12,
   },
   toggle: {
     flexDirection: "row",
     backgroundColor: colors.surface,
     borderRadius: 12,
     padding: 4,
     alignSelf: "flex-start",
   },
   toggleBtn: {
     paddingVertical: 8,
     paddingHorizontal: 16,
     borderRadius: 8,
     alignItems: "center",
   },
   toggleActive: { backgroundColor: colors.accent },
   toggleText: {
     color: colors.textSecondary,
     fontSize: 14,
     fontWeight: "600",
   },
   toggleTextActive: { color: colors.onAccent, fontWeight: "700" },
   scroll: { paddingTop: 16 },
 });
}