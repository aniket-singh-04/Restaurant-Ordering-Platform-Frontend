# Restaurant Ordering Platform Frontend

React + TypeScript frontend for a restaurant ordering platform built with Vite. The app includes customer-facing menu browsing and cart flows, plus an admin area for dashboard, menu, orders, analytics, settings, and account management.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- Headless UI
- Lucide React

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

### 3. Run the production build

```bash
npm run build
```

## Available Scripts

- `npm run dev` starts the Vite dev server.
- `npm run build` runs `tsc -b` and then creates the production bundle with Vite.
- `npm run lint` runs ESLint.
- `npm run preview` previews the built app locally.

## Route Overview

Public routes:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

Protected customer routes:

- `/`
- `/menu`
- `/menu/:id`
- `/cart`
- `/profile`

Protected admin routes:

- `/admin`
- `/admin/menu`
- `/admin/menu/new`
- `/admin/menu/edit/:id`
- `/admin/orders`
- `/admin/analytics`
- `/admin/settings`
- `/admin/addups`
- `/admin/accountmanagement`

Supporting routes:

- `/not-authorized`
- `*` -> not found

## Project Structure

```text
src/
  app/
    AppProviders.tsx
    router.tsx
  components/
    Header/
      Header.tsx
      RestaurantSelector.tsx
      storage.ts
  constants/
    storageKeys.ts
  context/
    AuthContext.tsx
    CartContext.tsx
    ThemeContext.tsx
    ToastContext.tsx
  features/
    auth/
      access.ts
      storage.ts
      types.ts
      user.ts
  hooks/
    useDebounce.ts
    useLocalStorage.ts
  pages/
    admin/
      AdminLayout.tsx
      AddUp.tsx
      MenuManagement.tsx
      constants.ts
      components/
        MenuFormPage.tsx
        shared/
          AdminFormControls.tsx
    user/
      menu/
        MenuHome.tsx
        MenuList.tsx
        MenuItemDetail.tsx
        menu.utils.ts
        components/
          MenuItemsGrid.tsx
          MenuPageLayout.tsx
          MenuSearchBar.tsx
  routes/
    ProtectedRoute.tsx
    PublicRoute.tsx
  store/
  styles/
  types/
  utils/
    api.ts
    formatPrice.ts
    storage.ts
    validators.ts
```

## Architecture Notes

### App Bootstrap

- `src/App.tsx` is intentionally thin.
- `src/app/AppProviders.tsx` composes theme, toast, auth, and cart providers.
- `src/app/router.tsx` owns route registration and route guards.

### Auth

- `src/features/auth/types.ts` contains shared auth types.
- `src/features/auth/access.ts` contains role constants and role-matching helpers.
- `src/features/auth/user.ts` normalizes API user payloads.
- `src/features/auth/storage.ts` centralizes token persistence.

### Storage

- `src/constants/storageKeys.ts` holds local storage keys in one place.
- `src/utils/storage.ts` contains reusable local storage helpers.
- Header restaurant/table selection also uses a dedicated helper in `src/components/Header/storage.ts`.

### Menu UI Reuse

- `src/pages/user/menu/menu.utils.ts` contains shared menu filtering helpers.
- `MenuPageLayout.tsx` standardizes the customer menu page shell.
- `MenuSearchBar.tsx` reuses the menu search input UI.
- `MenuItemsGrid.tsx` reuses menu card rendering and empty states.

### Admin UI Reuse

- `src/pages/admin/constants.ts` centralizes admin navigation config.
- `src/pages/admin/components/shared/AdminFormControls.tsx` contains reusable admin section, field, input, textarea, and checkbox wrappers.
- `AddUp.tsx` and `MenuFormPage.tsx` use those shared admin controls to reduce duplication.

## Important Files

- `src/main.tsx` mounts the application.
- `src/App.tsx` connects providers and the router.
- `src/app/router.tsx` defines the route tree.
- `src/context/AuthContext.tsx` manages session state and refresh/logout behavior.
- `src/utils/api.ts` contains the shared API request wrapper.
- `src/pages/user/menu/MenuHome.tsx` and `src/pages/user/menu/MenuList.tsx` drive customer menu discovery.
- `src/pages/admin/AdminLayout.tsx` drives admin shell navigation.

## Known Issues

At the moment, `npm run build` is blocked by existing project issues outside the core refactor:

- `src/components/Food3DViewer/Food3DViewer.tsx` requires `@react-three/fiber`, `@react-three/drei`, and `three`, but those packages are not currently present in `package.json`.
- `src/pages/admin/Accounts.tsx` still contains unused imports/state that fail the current TypeScript build settings.

If you want the build fully green, those two areas should be cleaned up next.

## Development Guidelines

- Keep business logic in place and prefer structural refactors over behavior changes.
- Reuse shared helpers in `src/app`, `src/features`, `src/utils`, and `src/pages/.../components/shared` before duplicating logic.
- Add new route-level pages under `src/pages`.
- Add reusable UI under `src/components` or feature-local `components` folders when it is page-specific.
- Keep storage keys and auth role rules centralized instead of scattering strings across pages.
