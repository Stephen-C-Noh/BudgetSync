import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const PIN_KEY = "budgetsync_pin";

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function authenticate(promptMessage = "Verify your identity"): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    disableDeviceFallback: false,
    cancelLabel: "Cancel",
  });
  return result.success;
}

export async function setPIN(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function verifyPIN(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored === pin;
}

export async function clearPIN(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}

export async function hasPIN(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored !== null;
}
