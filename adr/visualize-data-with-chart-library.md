# ADR-006: Data Visualization

## Title
Use a React Native Chart Library for Data Visualization

## Status
Accepted

## Context
BudgetSync needs to display charts for expenses and budgets. Building charts from scratch would require significant extra math and graphics work, well beyond the scope of this course and project.

## Options Considered

### Build Charts from Scratch
Building charts entirely from scratch would take too much time and effort, and the output quality would be difficult to match compared to a dedicated library.

### Embedded Web Charts
Using web-based chart libraries inside a WebView would be harder to set up within React Native and would create a disconnect between native and web rendering layers.

### React Native Chart Library ✅
A purpose-built React Native chart library lets us input budget data into pre-made chart components that automatically render clean, professional visuals — without reinventing the wheel.

## Decision
We will use a **React Native chart library** — specifically **react-native-chart-kit** — to handle all data visualization in BudgetSync. Budget and expense data is passed to the library's chart components, which handle rendering automatically.

## Consequences

### Easier
- **Faster Implementation** — Charts can be built in significantly less time compared to a custom solution.
- **Professional Visualizations** — The library provides smooth animations and clean styling out of the box, making the app look polished.
- **Reduced Complexity** — Since the library handles the rendering logic, we can focus development time on other important features.

### More Difficult
- **Limited Customization** — We cannot customize every visual detail since we are working within the styles and options the library exposes.
- **External Dependency** — Each library added increases the app bundle size. We should only add libraries we genuinely need and will use.
