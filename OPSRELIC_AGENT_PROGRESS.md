# OpsRelic V2 Restructuring Progress

## Phase 1: Understand & Map (Current State)

### Current File Structure
- `/src/components/`: Contains both page components (`Dashboard.tsx`, `Upload.tsx`, `Workspace.tsx`, `Campaigns.tsx`, `Reports.tsx`, `Pipeline.tsx`, `CopilotPage.tsx`, `Landing.tsx`, etc.) and reusable/helper components (`AnimatedNumber.tsx`, `ClientDrawer.tsx`, etc.).
- `/src/lib/`: Contains `store.tsx`, `firebase.ts`, `data.ts`, `utils.ts`, etc.
- `/src/App.tsx`: The monolithic entry point handling routing, auth, and layout.

### Data & Navigation Flow
- Navigation is handled via `window.location.hash` in `App.tsx`.
- Data flows from `AppProvider` (`/src/lib/store.tsx`) down to various page components.
- CSV/Dashboard/Portal flows rely on the `AppContext`.

### Structural Issues (The "Mess")
1. **Bloated `App.tsx`**: Manages routing, auth checks, layout, and global state initialization.
2. **Component Mix**: Page components and fine-grained UI components are mixed in the same directory.
3. **Fragile Routing**: Hash-based routing is hard to manage and scale for complex navigation.
4. **Scattered Logic**: State and business logic are frequently defined inside components rather than in dedicated service/state layers.

---

# OpsRelic V2 Restructuring Progress

## Phase 1: Understand & Map (Current State)

### Current File Structure
- `/src/components/`: Contains both page components (`Dashboard.tsx`, `Upload.tsx`, `Workspace.tsx`, `Campaigns.tsx`, `Reports.tsx`, `Pipeline.tsx`, `CopilotPage.tsx`, `Landing.tsx`, etc.) and reusable/helper components (`AnimatedNumber.tsx`, `ClientDrawer.tsx`, etc.).
- `/src/lib/`: Contains `store.tsx`, `firebase.ts`, `data.ts`, `utils.ts`, etc.
- `/src/App.tsx`: The monolithic entry point handling routing, auth, and layout.

### Data & Navigation Flow
- Navigation is handled via `window.location.hash` in `App.tsx`.
- Data flows from `AppProvider` (`/src/lib/store.tsx`) down to various page components.
- CSV/Dashboard/Portal flows rely on the `AppContext`.

### Structural Issues (The "Mess")
1. **Bloated `App.tsx`**: Manages routing, auth checks, layout, and global state initialization.
2. **Component Mix**: Page components and fine-grained UI components are mixed in the same directory.
3. **Fragile Routing**: Hash-based routing is hard to manage and scale for complex navigation.
4. **Scattered Logic**: State and business logic are frequently defined inside components rather than in dedicated service/state layers.

---

## Phase 2: Proposed V2 Architecture

### Proposed File Structure
- `/src/pages/`: Dedicated domains.
  - `/src/pages/overview/`
  - `/src/pages/campaigns/`
  - `/src/pages/upload/`
  - `/src/pages/intelligence/`
  - `/src/pages/portal/`
  - `/src/pages/settings/`
- `/src/layouts/`: `AppLayout.tsx`, `AuthLayout.tsx` for consistent page structures.
- `/src/components/shared/`: Reusable UI components (buttons, icons, drawers).
- `/src/hooks/`: Custom hooks to extract business logic from components.
- `/src/services/`: (Already partially exists) API and service-level logic.

### Routing Goal
- Separate layout from page content.
- Replace monolithic `App.tsx` routing with a cleaner route config object, still using hash-based navigation to minimize regression risks in this phase.
