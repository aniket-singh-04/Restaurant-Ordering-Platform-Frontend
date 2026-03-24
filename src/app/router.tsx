import { createBrowserRouter } from "react-router-dom";
import type { ReactElement } from "react";
import MenuItemDetail from "../pages/user/menu/MenuItemDetail";
import MenuHome from "../pages/user/menu/MenuHome";
import MenuList from "../pages/user/menu/MenuList";
import NotFound from "../pages/not-found/NotFound";
import NotAuthorized from "../pages/not-authorized/NotAuthorized";
import CartPage from "../pages/user/cart/CartPage";
import AdminLayout from "../pages/admin/AdminLayout";
import AdminDashboard from "../pages/admin/Dashboard";
import MenuManagement from "../pages/admin/MenuManagement";
import Register from "../pages/Register";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import VerifyEmail from "../pages/VerifyEmail";
import ProtectedRoute from "../routes/ProtectedRoute";
import PublicRoute from "../routes/PublicRoute";
import ProfileLayout from "../pages/ProfileLayout";
import OrdersManagement from "../pages/admin/OrdersManagement";
import Analytics from "../pages/admin/Analytics";
import Settings from "../pages/admin/Settings";
import MenuFormPage from "../pages/admin/components/MenuFormPage";
import AddUp from "../pages/admin/AddUp";
import Accounts from "../pages/admin/Accounts";
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

export const router = createBrowserRouter([
  {
    path: "/",
    element: withProtectedRoute(<MenuHome />, AUTHENTICATED_APP_ROLES),
  },
  {
    path: "/login",
    element: withPublicRoute(<Login />),
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
    element: withProtectedRoute(<ProfileLayout />, AUTHENTICATED_APP_ROLES),
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
  { path: "*", element: <NotFound /> },
]);
