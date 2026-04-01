import { AppProvider, useAppState } from "@/context/AppContext";
import { AuthContext } from "@/context/AuthContext";
import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";

function InnerLayout() {
  const { settings, isLoading } = useAppState();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key || isLoading) return;

    const biometricsEnabled =
      settings.find((s) => s.key === "biometrics_enabled")?.value === "true";
    const inAuthScreen = segments[0] === "auth";

    if (biometricsEnabled && !isAuthenticated && !inAuthScreen) {
      router.replace("/auth");
    } else if ((!biometricsEnabled || isAuthenticated) && inAuthScreen) {
      router.replace("/(tabs)");
    }
  }, [isLoading, isAuthenticated, navigationState?.key]);

  return (
    <AuthContext.Provider value={{ onAuthenticated: () => setIsAuthenticated(true) }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="add-transaction" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="category-settings" />
        <Stack.Screen name="budget-goals" />
      </Stack>
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <InnerLayout />
    </AppProvider>
  );
}
