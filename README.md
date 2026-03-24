# Restaurant Ordering Platform Frontend

React + TypeScript frontend for the restaurant ordering platform. It supports the customer menu flow, QR-based table sessions, cart and order entry, and the protected admin dashboard for menu, account, analytics, and table management.

## Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- TanStack Query
- Zustand
- Socket.IO client
- QR code utilities

## Scripts

```bash
npm install
npm run dev
npx tsc -b
npm run build
```

## Main Routes

Public auth routes:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`

Customer app routes:

- `/`
- `/menu`
- `/menu/:id`
- `/cart`
- `/profile`

QR session routes:

- `/qr/:publicQrId`
- `/qr/:publicQrId/menu`
- `/qr/:publicQrId/menu/:id`
- `/qr/:publicQrId/cart`

Admin routes:

- `/admin`
- `/admin/menu`
- `/admin/menu/new`
- `/admin/menu/edit/:id`
- `/admin/orders`
- `/admin/analytics`
- `/admin/settings`
- `/admin/addups`
- `/admin/accountmanagement`
- `/admin/tables`

## Current `src` Structure

```text
src/
  app/
    AppProviders.tsx
    router.tsx
  assets/
    fonts/
    icons/
    images/
  components/
    Header/
    MenuCard/
    ui/
  constants/
  context/
  features/
    analytics/
    auth/
    menu/
    orders/
    qr-context/
    tables/
  hooks/
  lib/
  pages/
    admin/
    not-authorized/
    not-found/
    public/
    user/
  routes/
  store/
  styles/
  types/
  utils/
  App.tsx
  index.css
  main.tsx
```

## Important Behavior

- QR routes require authentication before the menu list is shown.
- When a user logs in from a QR link, the app returns them to the scanned QR route.
- Canceling the QR login prompt keeps the customer out of the menu list.
- Admin users are blocked from the customer menu flow unless they entered through a valid QR table session.
- QR table context is shared across menu, item detail, and cart routes.

## Key Files

- `src/app/router.tsx` defines the route tree and QR/admin guards.
- `src/context/AuthContext.tsx` manages login state, refresh handling, and logout.
- `src/features/qr-context/` contains QR session APIs, navigation helpers, and store state.
- `src/features/menu/api.ts` and `src/features/tables/api.ts` wrap customer and admin API calls.
- `src/pages/admin/TableManagement.tsx` manages generated QR tables by branch.
- `src/pages/user/menu/` contains the customer menu browsing flow.
- `src/utils/navigation.ts` provides safe fallback navigation for back buttons.

## Verification

- `npx tsc -b`
- `npm run build`
