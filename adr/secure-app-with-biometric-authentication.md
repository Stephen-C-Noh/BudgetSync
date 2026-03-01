# ADR-005: Hardware Security

## Title
Use the Phone's Biometric Sensor for App Security

## Status
Accepted

## Context
BudgetSync displays sensitive personal financial data — income, spending, and budget information. The app must not be left open and accessible to anyone who picks up the phone. At the same time, requiring a long typed password every time a user wants to log a small purchase would be frustrating and create a poor user experience. The lock mechanism needs to be both fast and secure.

## Options Considered

### In-App PIN / Password
A PIN or password works but adds friction. Users must type every time they open the app, which is slow for frequent, small interactions.

### No Authentication
Leaves user financial data completely unprotected. Not acceptable for an app handling sensitive personal information.

### Biometric Hardware (Expo Local Authentication) ✅
The fastest way to verify a user — under one second — while fulfilling the requirement to use device hardware. Uses the physical security hardware already built into the phone.

## Decision
We will use **Expo Local Authentication** to enable:
- **Fingerprint sensor** on Android devices
- **Face ID** on iOS devices

The library automatically selects the appropriate biometric method for the device with no separate code paths needed.

A **backup PIN screen** will also be implemented as a fallback for cases where biometric hardware is unavailable or fails (e.g., wet fingers, low-light conditions).

## Consequences

### Easier
- **One Codebase, Two Systems** — No separate code is needed for Android vs. iOS. The Expo Local Authentication library automatically uses the correct biometric method per platform.
- **Quick Access** — Authentication completes in under one second, keeping the experience smooth and non-intrusive.
- **High Security** — Keeps financial data private even if the user leaves their phone unlocked or unattended.

### More Difficult
- **Testing Requires Physical Devices** — Biometric authentication cannot be fully tested on a laptop or emulator. Both an Android and an iOS device are needed for proper testing.
- **Permission Required** — The app must explicitly request the user's permission to use Face ID or their fingerprint before biometric authentication can be used.
- **Backup Plan Needed** — A fallback PIN screen must be implemented for cases where the biometric hardware fails or is unavailable.
