# Refactoring Summary

## Cleanup

- **Deleted Unused Routes**: Removed `landing.tsx`, `landing2.tsx`, and `signup.tsx` as requested.

## State Management (Zustand)

- **New Stores**:
  - `src/store/userStore.ts`: Manages user mode (Toddler/Pet) and profile information.
  - `src/store/mapStore.ts`: Centralizes map state (Map Mode, Focused Spot, Routing Info, Notifications, Manual Location).
- **Updates**:
  - `src/routes/index.tsx`: Now uses `userStore` to set the application mode globally.
  - `src/routes/map.tsx`: Heavily refactored to remove local `useState` clutter. Now relies on `mapStore`, `filterStore`, and `userStore`.

## Component Extraction & Logic Separation

- **Side Navigation (Piano Keys)**:
  - Extracted to `src/components/SideNavigation.tsx`.
  - Logic for visibility is now cleaner and separated. Currently configured to hide during **Routing Mode**.
- **Route Navigation**:
  - Updated to use shared `RoutePoint` type definition in `src/types/map.ts`.

## Improvements

- **Performance**: Reduced prop drilling and `useState` re-renders by using granular store selectors (conceptually) and removing local state from `MapPage`.
- **Maintainability**: Map logic is now split between the View (`MapPageContent`) and the Store (`mapStore`), making it easier to debug navigation and routing flows.
