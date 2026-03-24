import type { ComponentType } from "react";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Table2Icon,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { MdManageAccounts } from "react-icons/md";
import type { UserRole } from "../../features/auth/types";

export interface AdminNavItem {
  to: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  end?: boolean;
  roles?: UserRole[];
}

export const adminNavItems: AdminNavItem[] = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/menu", icon: UtensilsCrossed, label: "Menu" },
  { to: "/admin/orders", icon: ClipboardList, label: "Orders" },
  {
    to: "/admin/analytics",
    icon: BarChart3,
    label: "Analytics",
    roles: ["ADMIN", "RESTRO_OWNER"],
  },
  {
    to: "/admin/settings",
    icon: Settings,
    label: "Settings",
    roles: ["ADMIN", "RESTRO_OWNER"],
  },
  {
    to: "/admin/addups",
    icon: User,
    label: "Add Ups",
    roles: ["ADMIN", "RESTRO_OWNER"],
  },
  {
    to: "/admin/accountmanagement",
    icon: MdManageAccounts,
    label: "Accounts",
    roles: ["ADMIN", "RESTRO_OWNER"],
  },
  {
    to: "/admin/tables",
    icon: Table2Icon,
    label: "Tables",
    roles: ["ADMIN", "RESTRO_OWNER", "BRANCH_OWNER"],
  },
];
