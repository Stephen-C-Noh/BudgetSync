# ADR-004: UI & App Flow

## Title
Use React Navigation (Bottom Tabs and Stack Navigator) for Screen Navigation

## Status
Accepted

## Context
The app contains multiple screens: Home, Add Income, Add Expense, Budget Summary, Charts, and AI Assistant. Using only a Stack Navigator would make it difficult for users to move between screens quickly — they would have to keep pressing the back button. We want the main features to always be accessible from a bottom navigation bar.

## Options Considered

### Conditional Rendering
Managing screen visibility through conditional rendering in a single component would result in messy, hard-to-maintain code and would not scale with the number of screens.

### Custom Navigation Logic
Building our own navigation from scratch increases maintenance difficulty when React Navigation already handles this perfectly. It would shift time away from building the actual features.

### React Navigation ✅
A well-established library that provides both Bottom Tab Navigator and Native Stack Navigator out of the box, with strong documentation and community support.

## Decision
We will use **React Navigation** to implement:
- A **Bottom Tab Navigator** as the main navigation shell, always visible at the bottom of the screen.
- A **Native Stack Navigator** inside each tab to handle sub-screens (e.g., clicking a button to add an expense or edit a monthly budget).

The AI Assistant will have its own dedicated tab in the bottom navigation bar.

## Consequences

### Easier
- **Instant Access to AI** — Having the AI Assistant as a dedicated tab means users can ask for financial advice with one tap from any screen.
- **Saves Your Place** — If a user is mid-conversation in the AI chat and switches tabs, the tab retains its state when they return.
- **Organized Screen Flow** — Bottom tabs eliminate the need to keep hitting the back button, making navigation significantly faster.
- **Standard Navigation Pattern** — Bottom tab navigation is familiar to users of most modern apps (e.g., Instagram, banking apps), making BudgetSync feel polished and professional.

### More Difficult
- **Coding Complexity** — Nested navigation (tabs containing stacks) is more complex to set up than a flat list of screens. Some extra setup time will be needed.
- **Additional Dependencies** — A few additional libraries are required to make navigation work, increasing the number of dependencies to manage.
- **Screen Space** — The bottom nav bar occupies a small amount of vertical space. Care must be taken to ensure charts and content are not too cramped on smaller devices.
