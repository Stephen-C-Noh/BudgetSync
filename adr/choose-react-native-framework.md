# ADR-001: Framework & Tools

## Title
Use React Native with Expo for Android and iOS App Development

## Status
Accepted

## Context
The BudgetSync application needs to operate on both Android and iOS platforms and must be created using Visual Studio Code and Node.js according to course specifications. We require a development model that facilitates deployment while integrating with JavaScript without adding unnecessary complexity. We also want an efficient development process so we can focus on the actual financial tracking functionality rather than spending time on low-level Android and iOS configuration.

## Options Considered

### Native Android (Java/Kotlin)
Native Android development using Java or Kotlin gives full control over the Android platform. However, it requires deeper platform-specific knowledge, Android Studio setup, and additional configuration that goes beyond the course focus. It would significantly increase development time and complexity.

### Flutter
Flutter is a powerful cross-platform framework, but it requires learning Dart, which is not covered in this course. Introducing a new programming language would slow development and shift focus away from applying the JavaScript knowledge we are building in class.

### React Native (with Expo) ✅
React Native allows building mobile applications using JavaScript and React concepts, which align directly with our coursework. Expo simplifies the development environment by handling much of the configuration required for both Android and iOS builds, and allows quick testing via physical devices or emulators without complex setup.

## Decision
We will use **React Native with Expo** to develop the BudgetSync application. This framework keeps the project within academic scope while allowing us to build a fully functional mobile application.

## Consequences

### Easier
- **Faster Setup and Development** — Expo handles native configuration automatically, letting us start building features immediately.
- **Use of Existing JavaScript Knowledge** — We can apply what we've already learned instead of picking up an entirely new language.
- **Simplified Testing** — Expo enables quick testing on both Android and iOS devices without complex native build processes.
- **Strong Community Support** — React Native has extensive documentation and community resources for solving technical issues.

### More Difficult
- **Limited Access to Advanced Native Features** — Expo abstracts away some low-level functionality. Customization would be more complicated if advanced native modules were needed (they are not for this project).
- **Dependency on Expo Ecosystem** — We rely on Expo's tooling and compatibility. If certain libraries are unsupported, adjustments may be needed.
- **Less Control Compared to Pure Native Development** — React Native does not provide the same granular control as writing native code directly. This trade-off is acceptable for a course-level project.
