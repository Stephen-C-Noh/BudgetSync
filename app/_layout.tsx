import { AppProvider } from "@/context/AppContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-transaction" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="category-settings" />
        <Stack.Screen name="budget-goals" />
      </Stack>
    </AppProvider>
  );
}
