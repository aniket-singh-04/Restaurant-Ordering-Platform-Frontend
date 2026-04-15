# Restaurant Ordering Platform - Frontend Documentation

## 1. Project Overview & Purpose
This application serves as the user-facing interface for a comprehensive restaurant ordering system. It accommodates multiple user types, ranging from diners scanning QR codes at tables to staff members fulfilling orders, and branch managers or platform administrators viewing analytics. Built with a modern, high-performance tech stack, this frontend emphasizes speed, responsiveness, and robust state management to handle high-concurrency order tracking and multi-tenant menus seamlessly.

## 2. Tech Stack
- **Framework:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool / Bundler:** [Vite v7+](https://vitejs.dev/)
- **Styling:** [TailwindCSS v4](https://tailwindcss.com/)
- **UI Architecture:** Headless UI & Radix UI
- **State Management (Local/UI):** [Zustand](https://github.com/pmndrs/zustand)
- **State Management (Server/Caching):** [React Query / TanStack Query](https://tanstack.com/query/latest)
- **Routing:** [React Router DOM v7](https://reactrouter.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Charts / Analytics:** [Recharts](https://recharts.org/)
- **3D / Advanced Graphics:** [Three.js](https://threejs.org/) + `@react-three/fiber` + `@react-three/drei`
- **Icons:** [Lucide React](https://lucide.dev/) & React Icons

## 3. Folder Structure Overview
The `src/` directory is logically separated according to generic software architecture patterns, prioritizing feature-based cohesion.

```text
src/
├── app/              # Top-level application providers, global Router component, and Query Client config.
├── assets/           # Static media assets, icons, and fonts.
├── components/       # Reusable, shared generic UI components (Layouts, Forms, Feedback, Dialogs).
├── config/           # Application-wide configurations and environment mappers.
├── constants/        # Centralized ENUMs, route paths, configuration objects, and string literals.
├── context/          # React Context providers (legacy or globally scoped context wrapping).
├── features/         # Feature-based domains (e.g., Auth, Menu, Cart). Each contains its own hooks and logic.
├── hooks/            # Global custom React hooks used across multiple features.
├── lib/              # Third-party library configurations (e.g., API Interceptors, Socket.io, formatters).
├── pages/            # View-layer pages combining components to represent route-connected screens.
│   ├── admin/        # Platform administrator views.
│   ├── user/         # Customer/Diner-facing views (Profile, Layouts).
│   ├── platform-admin/# Platform-level management pages.
│   └── (others)      # Generic, standalone pages (Login, Register, Not Found).
├── routes/           # Detailed route definitions, guard patterns, and nested layouts.
├── security/         # Client-side security layers, token handlers, sanitizers.
├── store/            # Global Zustand stores (UI state, ephemeral interactions).
├── styles/           # Global CSS overrides and Tailwind directives (index.css).
├── types/            # Global TypeScript definitions, DTOs, and shared generic types.
└── utils/            # Helper functions, pure business-logic utilities, and Axios API config.
```

## 4. Component Architecture
- **Smart vs. Presentational Components:** Data-fetching and complex side-effects are heavily decoupled from rendering. The components inside `pages/` aggregate contexts and query hooks, passing required props down to isolated UI modules located within `components/` and `features/`.
- **Error Boundaries:** To ensure the user application does not crash in its entirety due to an isolated render error, crucial sections of the component tree are typically wrapped via robust Error Boundaries.

## 5. State Management Approach
The solution leverages a strict bifurcation of state responsibilities:
- **Server State (React Query):** Aggressively caches API GET requests, manages background polling, handles data freshness (stale times), and resolves mutation lifecycles seamlessly across custom hooks.
- **Client/UI State (Zustand):** For ephemeral or global UI interactions (like sidebars, toggles, generic cart state interactions), Zustand provides zero-boilerplate, fast reactive stores without Context API re-render overhead.

## 6. Routing Structure
Using **React Router DOM**, the application heavily utilizes conditional and encapsulated route logic:
- **Public Routes:** Authentication (Login, Register, Forgot Password, Reset Password, Verify Email) and public landing instances.
- **Customer Routes:** Pages dedicated to consumer-profile layouts and dining interactions.
- **Protected Administrative / Staff Routes:** Encapsulated behind Guard components or middleware wrappers. Components verify the user's role against RBAC policies before rendering specific views. Falling out of scope triggers a redirection to the `not-authorized` interface.

## 7. UI/UX Design System
- **Tailwind v4 Setup:** The application relies on the latest feature sets of Tailwind CSS v4 to orchestrate layout, heavily favoring dynamic custom colors, flexbox/grid containers, and fully responsive breakpoints.
- **Interactions & Animations:** Micro-interactions (hover, active states) are augmented by standard CSS transitions. Complex entrance/exit animations and staggered layout modifications are handled gracefully by `framer-motion`.
- **Rich Elements & Renderings:** Three.js integrations are used where interactive or complex volumetric renders elevate the UX standard beyond typical flat design sets.

## 8. API Integration Details
All API communications are routed through dedicated API handlers or configured standard agents (typically Axios or native Fetch augmented via `utils` or `lib` constants).
- **Interceptors & Headers:** Designed to seamlessly transport Authentication tokens (Bearer JWT or signed cookies) to the Node backend.
- **Feature Hook Mapping:** Instead of manually invoking Axios requests inside component lifecycle events, React Query `useQuery` and `useMutation` hooks housed within the `/features` or `/hooks` layer construct a clean boundary between the component UI and backend API schema.

## 9. Environment Variables Setup
Environment details should be defined strictly in local and production environments:
- `.env` and `.env.production` files should define critical paths such as:
  - `VITE_API_URL`: The targeted backend API URL (e.g., `http://localhost:5000/api/v1`).  
  - Optional metrics and WebSocket endpoint parameters depending on scale.

## 10. Installation & Setup Instructions
1. Clone the repository and navigate into the `Restaurant-Ordering-Platform-Frontend` directory.
2. Ensure **Node.js (v20+)** and **npm** are installed.
3. Install project dependencies:
   ```bash
   npm install
   ```
4. Copy `.env` or set up your local `.env` values based on available backend references.
5. Spin up the Vite development server:
   ```bash
   npm run dev
   ```

## 11. Build & Deployment Process
- Production Builds are generated securely via `npm run build`, processing TS checks (`tsc -b`) before pushing the Vite build pipeline.
- Generates tree-shaken and chunked static asset output within the `dist/` directory.
- The build is fully CDN-ready and can be quickly hosted via environments like **AWS CloudFront/S3, Vercel, or Netlify**.

## 12. Performance Optimizations
- **React Compiler Integration:** Utilizing modern React 19 compiler properties mapped via Babel plugins to reduce manual `useMemo` / `useCallback` footprints.
- **Tree-Shaking & Chunking:** Vendor libraries (Three.js, Lucide icons, Framer Motion) configure explicit split chunks mitigating massive main-thread blocking loads.
- **Data Caching:** React Query actively diffs against stale-state rules, significantly dampening the volume of outgoing duplicate network requests.

## 13. Known Issues & Limitations
- If running under restricted internal workplace browsers or outdated generic browser runtimes, the `Three.js` contexts might fallback to slower, software-rendered modes.
- WebSocket interactions assume steady connectivity. While optimistic offline UI strategies are partly accounted for, full PWA (Progressive Web App) compliance with advanced IndexedDB replication remains outside the initial scope.
