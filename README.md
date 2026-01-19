# Restaurant Ordering Platform — Orderly

Short description
A React + TypeScript frontend for a restaurant ordering platform (Vite-style entry). Provides a component-based UI (header, menu cards, category pills, footer), a small store slice for categories, utilities, and layouts for user/admin pages.
```

Project structure (key files)
- Entry
  - [src/main.tsx](src/main.tsx)
  - [src/App.tsx](src/App.tsx)
  - [src/index.css](src/index.css)
- Assets & styles
  - [src/assets/](src/assets) — fonts, icons, images
  - [src/styles/globals.css](src/styles/globals.css)
- Components (reusable UI)
  - [src/components/Header/Header.tsx](src/components/Header/Header.tsx)
  - [src/components/Header/constants.ts](src/components/Header/constants.ts)
  - [src/components/Header/index.ts](src/components/Header/index.ts)
  - [src/components/CategoryPills/CategoryPills.tsx](src/components/CategoryPills/CategoryPills.tsx)
  - [src/components/MenuCard/MenuCard.tsx](src/components/MenuCard/MenuCard.tsx)
  - [src/components/Footer/Footer.tsx](src/components/Footer/Footer.tsx)
  - [src/components/Food3DViewer/Food3DViewer.tsx](src/components/Food3DViewer/Food3DViewer.tsx)
- Pages & Layouts
  - [src/pages/user/menu/MenuView.tsx](src/pages/user/menu/MenuView.tsx)
  - [src/pages/user/menu/MenuViewIdx.tsx](src/pages/user/menu/MenuViewIdx.tsx)
  - [src/pages/user/menu/MenuItemDetail.tsx](src/pages/user/menu/MenuItemDetail.tsx)
  - [src/pages/admin/Dashboard.tsx](src/pages/admin/Dashboard.tsx)
  - [src/layouts/MainLayout.tsx](src/layouts/MainLayout.tsx)
  - [src/layouts/AdminLayout.tsx](src/layouts/AdminLayout.tsx)
- State & hooks
  - [src/store/store.ts](src/store/store.ts)
  - [src/store/index.ts](src/store/index.ts)
  - [src/store/categories.slice.ts](src/store/categories.slice.ts)
  - [src/hooks/useDebounce.ts](src/hooks/useDebounce.ts)
  - [src/context/ThemeContext.tsx](src/context/ThemeContext.tsx)
- Types & utils
  - [src/types/index.ts](src/types/index.ts)
  - [src/utils/formatPrice.ts](src/utils/formatPrice.ts)
```

What each area does (concise)
- src/components: UI building blocks. Import these into pages or layouts.
- src/pages: Route-level components. Keep routing logic outside if using a router.
- src/layouts: App-level shells (header/footer wrappers).
- src/store: Global state (slice pattern). Initialize store in [src/main.tsx](src/main.tsx) or [src/App.tsx](src/App.tsx).
- src/hooks & src/context: Reusable hooks and React contexts.
- src/styles & src/assets: Global CSS and static assets.

Common tasks
- Add a new component:
  1. Create folder in src/components/MyComponent
  2. Add MyComponent.tsx and index.ts exporting default
  3. Import via relative path: ./components/MyComponent
- Add a new page:
  1. Create file under src/pages/...
  2. Add route in your router (if present) and wrap with a layout.
- Convert Tailwind -> plain CSS:
  - Create a .css alongside component.
  - Replace utility classes with semantic classNames and import the .css.

Troubleshooting
- Missing imports after refactor: run `npx tsc --noEmit` to list errors and update paths.
- Dev server not starting: ensure correct scripts in package.json (common: `dev`, `build`, `preview`).
- CSS not applied: confirm component imports its .css and project CSS loader is configured.

Notes & recommendations
- Add an index barrel in each component folder for simpler imports.
- Add linting (ESLint) and formatting (Prettier) for consistency.
- Add unit tests (Jest / Vitest) for critical components: Header, MenuCard, utils/formatPrice.

References (open these files directly)
- [src/main.tsx](src/main.tsx)
- [src/App.tsx](src/App.tsx)
- [src/components/Header/Header.tsx](src/components/Header/Header.tsx)
- [src/components/Header/constants.ts](src/components/Header/constants.ts)
- [src/components/CategoryPills/CategoryPills.tsx](src/components/CategoryPills/CategoryPills.tsx)
- [src/store/store.ts](src/store/store.ts)
- [src/styles/globals.css](src/styles/globals.css)

If you want, I can:
- generate a README.md file in the repo,
- create barrel index.ts files for each folder,
- or produce a checklist to convert Tailwind classes to plain CSS per component (I can auto-generate CSS files for selected components).  
Tell me which option to do