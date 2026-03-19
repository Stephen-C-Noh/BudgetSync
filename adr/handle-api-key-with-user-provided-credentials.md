# ADR-008: API Key Management

## Title
Handle API Key with User-Provided Credentials via expo-secure-store

## Status
Accepted

## Context
The AI assistant feature requires a Google Gemini API key to function. The key must not be hardcoded into the app or committed to the repository. Three approaches exist: embed a shared key on a backend proxy, hardcode a developer-owned key in the app, or have each user supply their own key.

The backend proxy approach means all API usage is billed to the developer, which is not sustainable for a personal project with multiple users. Hardcoding a developer-owned key directly in the app exposes it to extraction and puts all usage costs on the developer. Having users supply their own key avoids both problems — each user is billed for their own usage, the developer pays nothing, and no key is ever shared or exposed in the codebase.

This is a recognized pattern used by many developer tools and personal productivity apps (e.g., Obsidian AI plugins, many open-source LLM frontends).

## Options Considered

### Backend Proxy (Developer-Owned Key)
A backend server holds the developer's API key and forwards requests from the app. The app never touches the key directly. However, all API usage across all users is billed to the developer. Gemini's free tier (1,500 requests/day) is shared across every user, which does not scale even modestly. Requires maintaining a hosted server for the lifetime of the app.

### Hardcoded Key in App Bundle
Embedding the key directly in the app is fast to implement but is a serious security risk. API keys can be extracted from app bundles. Any cost from all users' usage falls on the developer with no control.

### User-Provided Key with expo-secure-store ✅
Each user obtains their own free Gemini API key from [Google AI Studio](https://aistudio.google.com) and enters it once during onboarding. The key is stored on-device using `expo-secure-store`, which uses the device's secure enclave (Keychain on iOS, Keystore on Android). The developer pays nothing. Users own their own data pipeline.

## Decision
We will use a **bring-your-own-key (BYOK)** model. Users enter their own Gemini API key once during onboarding. It is stored securely on-device using **expo-secure-store** and retrieved at the time of each chat request. The developer's codebase contains no API key at any point.

Gemini's free tier covers 1,500 requests per day, which is more than sufficient for personal use. Most users will never pay anything.

### Key Lifecycle

```
Onboarding → User enters key → Validated with test API call
                                        ↓
                            Stored via expo-secure-store
                                        ↓
                    Retrieved per chat request (never held in memory longer than needed)
                                        ↓
                    User can update or delete key via Settings screen
```

### Storage

```js
import * as SecureStore from 'expo-secure-store';

// Save
await SecureStore.setItemAsync('gemini_api_key', userInputtedKey);

// Retrieve
const key = await SecureStore.getItemAsync('gemini_api_key');

// Delete
await SecureStore.deleteItemAsync('gemini_api_key');
```

### Chat Request

```js
const sendMessage = async (userMessage) => {
  const apiKey = await SecureStore.getItemAsync('gemini_api_key');

  if (!apiKey) {
    navigation.navigate('ApiKeySetup');
    return;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    { /* prompt with financial context summary */ }
  );
};
```

## Consequences

### Easier
- **Zero Developer Cost** — All API usage is billed to the individual user. The developer pays nothing regardless of how many users the app has.
- **No Backend Required** — No server to build, host, or maintain. The app calls Gemini directly.
- **User Data Sovereignty** — The user's API key and financial data never pass through a developer-controlled server. This is consistent with the privacy-first approach established in `integrate-ai-financial-assistant.md`.
- **Secure Storage** — `expo-secure-store` uses the device's native secure enclave. The key is never stored in plain AsyncStorage or exposed in logs.
- **Free for Most Users** — Gemini's free tier (1,500 requests/day) is more than enough for personal expense tracking. This should be communicated clearly during onboarding.

### More Difficult
- **Onboarding Friction** — Asking users to obtain and enter an API key is more friction than a zero-setup experience. Clear instructions and a direct link to Google AI Studio are essential to minimize drop-off.
- **Key Validation Needed** — The key must be validated with a test API call at the time of entry. An invalid or expired key should show a clear error immediately rather than failing silently later in the chat screen.
- **Graceful Degradation Required** — If a user skips key setup, the AI tab must show a friendly prompt rather than a broken or empty screen.
- **Key Rotation** — If a user's key expires or is revoked, the app must handle the resulting API error gracefully and direct them back to the settings screen to update it.
- **Never Log the Key** — Care must be taken to ensure the key never appears in console logs, crash reports, or error messages.

## UX Requirements
- Onboarding screen must explain clearly what the key is, why it is needed, and that it is stored only on the user's device.
- Provide a direct link to [aistudio.google.com](https://aistudio.google.com) where users can generate a free key.
- Allow users to skip setup and enable the feature later from a Settings screen.
- Show a clear success or failure indicator after the user saves their key.
- Settings screen must allow the user to view (masked), replace, or delete their stored key at any time.

## Related Decisions
- See `integrate-ai-financial-assistant.md` for the decision to use Google Gemini as the AI provider.
