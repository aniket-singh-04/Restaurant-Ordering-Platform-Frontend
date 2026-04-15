# Restaurant Ordering Platform - Frontend

A modern, production-grade frontend tailored for high-performance restaurant ordering experiences. Built to cater seamlessly to customers (via QR scans), staff, and administrative management.

## 🚀 Project Description

This platform is a comprehensive single-page application (SPA) focused heavily on delivering real-time UI states, optimal cart experiences, and administrative dashboards. The user interface prioritizes fluidity, dynamic animations, and complex data representations utilizing cutting-edge web tools. 

Designed modularly, the frontend isolates presentation from complex server-state logic, ensuring that menu browsing remains extremely fast and state changes (like order updates) flow flawlessly. 

## 🛠 Tech Stack

- **React 19** – The newest React paradigm, leveraging React Compiler enhancements.
- **TypeScript** – For rigid, scalable type-safety across models and components.
- **Vite 7+** – Next-generation, blazing-fast bundler and dev server.
- **TailwindCSS v4** – Utility-first, highly responsive CSS styling wrapper.
- **Zustand & React Query** – Decoupled, optimized client/server state management.
- **React Router DOM v7** – Dynamic routing algorithms and component-level layouts.
- **Framer Motion & Three.js** – Advanced animations and rich, interactive graphics.
- **Lucide React** – Clean, minimal icons.

## 📁 Folder Structure Overview

```text
src/
├── app/          # Global providers (Query Client, Routers)
├── components/   # Reusable UI building blocks (Layouts, Modals, Forms)
├── features/     # Feature vertical slices (Auth, Menu, Orders)
├── hooks/        # Shared custom React hooks
├── pages/        # Route mappings (Admin, Staff, User screens)
├── routes/       # Protected wrapper definitions and App Routes
├── store/        # Generic local state management (Zustand)
└── utils/        # Generic business logic, Interceptors, Axios setups
```

For full details regarding the architecture, see the included [`DOCUMENTATION.md`](./DOCUMENTATION.md) file.

## ⚙️ Setup & Installation Instructions

Ensure you have **Node.js v20+** installed on your system.

1. **Clone the project and navigate into the frontend directory:**
   ```bash
   git clone <your-repo-url>
   cd Restaurant-Ordering-Platform-Frontend
   ```

2. **Install all essential software packages:**
   ```bash
   npm install
   ```

3. **Configure the Environment:**
   Create a `.env` file in the root based on `.env.example`, populating critical links to your backend:
   ```env
   VITE_API_URL=http://localhost:3000/api/v1
   VITE_ws_URL=ws://localhost:3000
   ```

4. **Start the local Vite Dev Server:**
   ```bash
   npm run dev
   ```

## 📜 Available NPM Scripts

- `npm run dev`: Boots up the local Vite development server.
- `npm run build`: Executes strict TypeScript compilation checks (`tsc -b`), then builds production artifacts into the `dist` directory.
- `npm run lint`: Triggers the ESLint plugin pipeline ensuring code format conformity.
- `npm run preview`: Spins up a local production-build preview server simulating actual deployment.

## 🚀 Build and Deployment

Running `npm run build` generates a streamlined and chunked `.dist` folder.
Deploy this folder confidently to static web hosts such as AWS CloudFront (via S3 buckets), Cloudflare Pages, Vercel, or Netlify. The routes are configured to support SPA fallback behaviors (`index.html` rewrites).

## 🤝 Contribution Guidelines

- Component additions must be structurally modular (presentational). Complex fetch-level processes must belong inside `features` hooks.
- Prefix all feature branches cleanly, e.g., `feature/login-modal` or `fix/cart-overflow`.
- Ensure `npm run lint` cleanly passes before submitting Pull Requests.

## 📝 License

This project is proprietary. All rights reserved. Do not distribute without permission.
