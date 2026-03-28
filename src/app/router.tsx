import { createBrowserRouter } from "react-router-dom";
import type { ReactElement } from "react";
import MenuItemDetail from "../pages/user/menu/MenuItemDetail";
import MenuHome from "../pages/user/menu/MenuHome";
import MenuList from "../pages/user/menu/MenuList";
import NotFound from "../pages/not-found/NotFound";
import NotAuthorized from "../pages/not-authorized/NotAuthorized";
import CartPage from "../pages/user/cart/CartPage";
import OrdersPage from "../pages/user/orders/OrdersPage";
import AdminLayout from "../pages/admin/AdminLayout";
import AdminDashboard from "../pages/admin/Dashboard";
import MenuManagement from "../pages/admin/MenuManagement";
import Register from "../pages/Register";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import VerifyEmail from "../pages/VerifyEmail";
import PlatformAdminDashboard from "../pages/platform-admin/Dashboard";
import PlatformAdminLayout from "../pages/platform-admin/Layout";
import PlatformAdminLogin from "../pages/platform-admin/Login";
import PlatformAdminOrders from "../pages/platform-admin/Orders";
import PlatformAdminPayments from "../pages/platform-admin/Payments";
import PlatformAdminRestaurants from "../pages/platform-admin/Restaurants";
import PlatformAdminSubscriptions from "../pages/platform-admin/Subscriptions";
import PlatformAdminUsers from "../pages/platform-admin/Users";
import ProtectedRoute from "../routes/ProtectedRoute";
import PlatformProtectedRoute from "../routes/PlatformProtectedRoute";
import PublicRoute from "../routes/PublicRoute";
import QrRouteGuard from "../routes/QrRouteGuard";
import ProfilePage from "../pages/ProfilePage";
import OrdersManagement from "../pages/admin/OrdersManagementLive";
import Analytics from "../pages/admin/Analytics";
import Settings from "../pages/admin/Settings";
import MenuFormPage from "../pages/admin/components/MenuFormPage";
import AddUp from "../pages/admin/AddUp";
import Accounts from "../pages/admin/Accounts";
import Subscriptions from "../pages/admin/Subscriptions";
import {
  ADMIN_PANEL_ROLES,
  AUTHENTICATED_APP_ROLES,
} from "../features/auth/access";
import type { UserRole } from "../features/auth/types";
import TableManagement from "../pages/admin/TableManagement";

const withProtectedRoute = (
  element: ReactElement,
  roles?: UserRole | UserRole[],
) => <ProtectedRoute user={roles}>{element}</ProtectedRoute>;

const withPublicRoute = (element: ReactElement) => (
  <PublicRoute>{element}</PublicRoute>
);

const withPlatformProtectedRoute = (element: ReactElement) => (
  <PlatformProtectedRoute>{element}</PlatformProtectedRoute>
);

export const router = createBrowserRouter([
  {
    path: "/qr/:publicQrId",
    element: (
      <QrRouteGuard>
        <MenuList />
      </QrRouteGuard>
    ),
  },
  {
    path: "/qr/:publicQrId/menu",
    element: (
      <QrRouteGuard>
        <MenuList />
      </QrRouteGuard>
    ),
  },
  {
    path: "/qr/:publicQrId/menu/:id",
    element: (
      <QrRouteGuard>
        <MenuItemDetail />
      </QrRouteGuard>
    ),
  },
  {
    path: "/qr/:publicQrId/cart",
    element: (
      <QrRouteGuard>
        <CartPage />
      </QrRouteGuard>
    ),
  },
  {
    path: "/",
    element: withProtectedRoute(<MenuHome />, AUTHENTICATED_APP_ROLES),
  },
  {
    path: "/login",
    element: withPublicRoute(<Login />),
  },
  {
    path: "/platform/login",
    element: <PlatformAdminLogin />,
  },
  {
    path: "/forgot-password",
    element: withPublicRoute(<ForgotPassword />),
  },
  {
    path: "/reset-password",
    element: withPublicRoute(<ResetPassword />),
  },
  {
    path: "/verify-email",
    element: <VerifyEmail />,
  },
  {
    path: "/register",
    element: withPublicRoute(<Register />),
  },
  {
    path: "/menu",
    element: withProtectedRoute(<MenuList />, AUTHENTICATED_APP_ROLES),
  },
  {
    path: "/menu/:id",
    element: withProtectedRoute(<MenuItemDetail />, AUTHENTICATED_APP_ROLES),
  },
  {
    path: "/cart",
    element: withProtectedRoute(<CartPage />, AUTHENTICATED_APP_ROLES),
  },
  {
    path: "/profile",
    element: withProtectedRoute(<ProfilePage />, AUTHENTICATED_APP_ROLES),
  },
  {
    path: "/orders",
    element: withProtectedRoute(<OrdersPage />, AUTHENTICATED_APP_ROLES),
  },
  {
    path: "/not-authorized",
    element: <NotAuthorized />,
  },
  {
    path: "/admin",
    element: withProtectedRoute(<AdminLayout />, ADMIN_PANEL_ROLES),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: "menu",
        element: <MenuManagement />,
      },
      {
        path: "menu/new",
        element: <MenuFormPage />,
      },
      {
        path: "menu/edit/:id",
        element: <MenuFormPage />,
      },
      {
        path: "orders",
        element: <OrdersManagement />,
      },
      {
        path: "subscriptions",
        element: <Subscriptions />,
      },
      {
        path: "analytics",
        element: <Analytics />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "addups",
        element: <AddUp />,
      },
      {
        path: "accountmanagement",
        element: <Accounts />,
      },
      {
        path: "tables",
        element: <TableManagement />,
      },
    ],
  },
  {
    path: "/platform",
    element: withPlatformProtectedRoute(<PlatformAdminLayout />),
    children: [
      {
        index: true,
        element: <PlatformAdminDashboard />,
      },
      {
        path: "users",
        element: <PlatformAdminUsers />,
      },
      {
        path: "restaurants",
        element: <PlatformAdminRestaurants />,
      },
      {
        path: "orders",
        element: <PlatformAdminOrders />,
      },
      {
        path: "payments",
        element: <PlatformAdminPayments />,
      },
      {
        path: "subscriptions",
        element: <PlatformAdminSubscriptions />,
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
