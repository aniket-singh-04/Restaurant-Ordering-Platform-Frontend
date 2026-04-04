import { createBrowserRouter } from "react-router-dom";
import { lazy, type ReactElement } from "react";
import ProtectedRoute from "../routes/ProtectedRoute";
import PlatformProtectedRoute from "../routes/PlatformProtectedRoute";
import PublicRoute from "../routes/PublicRoute";
import QrRouteGuard from "../routes/QrRouteGuard";
import {
  ADMIN_PANEL_ROLES,
  AUTHENTICATED_APP_ROLES,
} from "../features/auth/access";
import type { UserRole } from "../features/auth/types";

const MenuItemDetail = lazy(() => import("../pages/user/menu/MenuItemDetail"));
const MenuHome = lazy(() => import("../pages/user/menu/MenuHome"));
const MenuList = lazy(() => import("../pages/user/menu/MenuList"));
const NotFound = lazy(() => import("../pages/not-found/NotFound"));
const NotAuthorized = lazy(() => import("../pages/not-authorized/NotAuthorized"));
const CartPage = lazy(() => import("../pages/user/cart/CartPage"));
const OrdersPage = lazy(() => import("../pages/user/orders/OrdersPage"));
const AdminLayout = lazy(() => import("../pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
const MenuManagement = lazy(() => import("../pages/admin/MenuManagement"));
const Register = lazy(() => import("../pages/Register"));
const Login = lazy(() => import("../pages/Login"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const VerifyEmail = lazy(() => import("../pages/VerifyEmail"));
const PlatformAdminDashboard = lazy(() => import("../pages/platform-admin/Dashboard"));
const PlatformAdminLayout = lazy(() => import("../pages/platform-admin/Layout"));
const PlatformAdminLogin = lazy(() => import("../pages/platform-admin/Login"));
const PlatformAdminOrders = lazy(() => import("../pages/platform-admin/Orders"));
const PlatformAdminPayments = lazy(() => import("../pages/platform-admin/Payments"));
const PlatformAdminRestaurants = lazy(() => import("../pages/platform-admin/Restaurants"));
const PlatformAdminSubscriptions = lazy(() => import("../pages/platform-admin/Subscriptions"));
const PlatformAdminUsers = lazy(() => import("../pages/platform-admin/Users"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const OrdersManagement = lazy(() => import("../pages/admin/OrdersManagementLive"));
const Analytics = lazy(() => import("../pages/admin/Analytics"));
// const Settings = lazy(() => import("../pages/admin/Settings"));
const MenuFormPage = lazy(() => import("../pages/admin/components/MenuFormPage"));
const AddUp = lazy(() => import("../pages/admin/AddUp"));
const Accounts = lazy(() => import("../pages/admin/Accounts"));
const Subscriptions = lazy(() => import("../pages/admin/Subscriptions"));
const TableManagement = lazy(() => import("../pages/admin/TableManagement"));

const SUBSCRIPTION_MANAGEMENT_ROLES: UserRole[] = ["ADMIN", "RESTRO_OWNER"];

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
        element: withProtectedRoute(<Subscriptions />, SUBSCRIPTION_MANAGEMENT_ROLES),
      },
      {
        path: "analytics",
        element: <Analytics />,
      },
      // {
      //   path: "settings",
      //   element: <Settings />,
      // },
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
